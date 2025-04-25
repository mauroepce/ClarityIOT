// src/screens/LoginScreen.tsx
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { AppContext } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function LoginScreen() {
  const { login } = useContext(AppContext);
  const { styles, colors } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Por favor, ingrese usuario y contraseña');
      return;
    }
    setLoading(true);
    const success = await login(username, password);
    if (!success) {
      Alert.alert('Error', 'Credenciales inválidas');
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <View
            style={{
              width: 100,
              height: 100,
              backgroundColor: colors.primary,
              borderRadius: 50,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: colors.primaryForeground,
                fontSize: 24,
                fontWeight: 'bold',
              }}
            >
              IOT
            </Text>
          </View>
          <Text style={styles.h1}>Iniciar Sesión</Text>
        </View>

        <View style={{ maxWidth: 320, alignSelf: 'center' }}>
          <Text style={styles.inputLabel}>Usuario</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <View style={{ padding: 12 }}>
              {/* Icono de usuario */}
              <MaterialIcons
                name="person"
                size={20}
                color={colors.mutedForeground}
              />
            </View>
            <TextInput
              style={{ flex: 1, height: 50, color: colors.foreground }}
              placeholder="Ingrese su usuario"
              placeholderTextColor={colors.mutedForeground}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.inputLabel}>Contraseña</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 8,
              marginBottom: 24,
            }}
          >
            <View style={{ padding: 12 }}>
              {/* Icono de candado */}
              <MaterialIcons
                name="lock"
                size={20}
                color={colors.mutedForeground}
              />
            </View>
            <TextInput
              style={{ flex: 1, height: 50, color: colors.foreground }}
              placeholder="Ingrese su contraseña"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
