import Grafico from './components/Grafico';
import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Alert,
  Button
} from 'react-native';
import * as FileSystem from 'expo-file-system'; // Adicione esta importação

import * as Database from './services/Database';
import Formulario from './components/Formulario';
import ListaRegistros from './components/ListaRegistros';
import * as Sharing from 'expo-sharing';

export default function App() {
  const [registros, setRegistros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [ordenacao, setOrdenacao] = useState('recentes');
  const [registroEmEdicao, setRegistroEmEdicao] = useState(null);

  useEffect(() => {
    const init = async () => {
      const dados = await Database.carregarDados();
      setRegistros(dados);
      setCarregando(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!carregando) {
      Database.salvarDados(registros);
    }
  }, [registros, carregando]);

  // Função handleSave corrigida
  const handleSave = (cafe, livros, viagens) => {
    const cafeNum = parseFloat(String(cafe).replace(',', '.'));
    const livrosNum = parseFloat(String(livros).replace(',', '.'));
    const viagensNum = parseFloat(String(viagens).replace(',', '.'));

    if (cafeNum < 0 || livrosNum < 0 || viagensNum < 0) {
      return Alert.alert("Erro de Validação", "Nenhum valor pode ser negativo. Por favor, corrija.");
    }

    if (registroEmEdicao) {
      // Modo edição
      const registrosAtualizados = registros.map(reg =>
        reg.id === registroEmEdicao.id ? { 
          ...reg, 
          cafe: cafeNum, 
          livros: livrosNum, 
          viagens: viagensNum 
        } : reg
      );
      setRegistros(registrosAtualizados);
      Alert.alert('Sucesso!', 'Registro atualizado!');
    } else {
      // Modo novo registro
      const novoRegistro = { 
        id: new Date().getTime(), 
        data: new Date().toLocaleDateString('pt-BR'), 
        cafe: cafeNum, 
        livros: livrosNum, 
        viagens: viagensNum 
      };
      setRegistros([...registros, novoRegistro]);
      Alert.alert('Sucesso!', 'Seu registro foi salvo!');
    }
    setRegistroEmEdicao(null);
  };

  const handleDelete = (id) => {
    setRegistros(registros.filter(reg => reg.id !== id));
    Alert.alert('Sucesso!', 'O registro foi deletado.');
  };

  const handleIniciarEdicao = (registro) => {
    setRegistroEmEdicao(registro);
  };

  const handleCancelarEdicao = () => {
    setRegistroEmEdicao(null);
  };

  const exportarDados = async () => {
    const fileUri = Database.fileUri;
    if (Platform.OS === 'web') {
      const jsonString = JSON.stringify(registros, null, 2);
      if (registros.length === 0) { 
        return Alert.alert("Aviso", "Nenhum dado para exportar."); 
      }
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); 
      a.href = url; 
      a.download = 'dados.json'; 
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) { 
        return Alert.alert("Aviso", "Nenhum dado para exportar."); 
      }
      if (!(await Sharing.isAvailableAsync())) { 
        return Alert.alert("Erro", "Compartilhamento não disponível."); 
      }
      await Sharing.shareAsync(fileUri);
    }
  };

  if (carregando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  let registrosExibidos = [...registros];

  if (ordenacao === 'maior_café') {
    registrosExibidos.sort((a, b) => b.cafe - a.cafe);
  } else {
    registrosExibidos.sort((a, b) => b.id - a.id);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.titulo}>meus vicios 💪aura + ego</Text>
        <Grafico registros={registrosExibidos} />
        <Text style={styles.subtituloApp}>App Componentizado</Text>

        <Formulario
          onSave={handleSave}
          onCancel={handleCancelarEdicao}
          registroEmEdicao={registroEmEdicao}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10, gap: 10 }}>
          <Button title="Mais Recentes" onPress={() => setOrdenacao('recentes')} />
          <Button title="Maior Valor (café)" onPress={() => setOrdenacao('maior_café')} />
        </View>

        <ListaRegistros
          registros={registrosExibidos}
          onEdit={handleIniciarEdicao}
          onDelete={handleDelete}
        />

        <View style={styles.card}>
          <Text style={styles.subtitulo}>Exportar "Banco de Dados"</Text>
          <TouchableOpacity style={styles.botaoExportar} onPress={exportarDados}>
            <Text style={styles.botaoTexto}>Exportar arquivo dados.json</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? 25 : 0, backgroundColor: '#f0f4f7' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  titulo: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: '#1e3a5f' },
  subtituloApp: { textAlign: 'center', fontSize: 16, color: '#555', marginTop: -20, marginBottom: 20, fontStyle: 'italic' },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginHorizontal: 15, marginBottom: 20, elevation: 3 },
  subtitulo: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: '#34495e' },
  botaoExportar: { backgroundColor: '#27ae60', padding: 15, borderRadius: 5, alignItems: 'center', marginTop: 5 },
  botaoTexto: { color: 'white', fontSize: 16, fontWeight: 'bold' },
});