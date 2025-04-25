// src/screens/SettingsScreen.tsx
import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { AppContext } from '../contexts/AppContext';
import { BluetoothContext } from '../contexts/BluetoothContext';
import { useTheme } from '../contexts/ThemeContext';
// Import correcto de MaterialIcons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function SettingsScreen() {
  const { logout, user } = useContext(AppContext);
  const { isEnabled } = useContext(BluetoothContext);
  const { styles, colors } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Está seguro de que desea cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'Acerca de',
      'ClarityIOT v1.0\nAplicación para lectura de sensores de peso Bluetooth\n\n© 2023 Clarity IOT',
      [{ text: 'OK' }]
    );
  };

  const handleHelp = () => {
    Alert.alert(
      'Ayuda',
      '1. Conecte un dispositivo Bluetooth desde la pantalla principal\n2. Lea el peso y complete el formulario\n3. Sincronice los datos cuando tenga conexión a Internet',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Configuración</Text>

        {user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información de Usuario</Text>
            <Text style={styles.text}>Usuario: {user.username}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bluetooth</Text>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Icono de Bluetooth */}
              <MaterialIcons
                name="bluetooth"
                size={20}
                color={isEnabled ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.text, { marginLeft: 8 }]}>
                Estado Bluetooth
              </Text>
            </View>
            <Text
              style={{
                color: isEnabled ? colors.primary : colors.destructive,
              }}
            >
              {isEnabled ? 'Activado' : 'Desactivado'}
            </Text>
          </View>
          <Text style={[styles.textMuted, { marginTop: 8 }]}>
            {isEnabled
              ? 'El Bluetooth está activado y listo para conectarse a dispositivos.'
              : 'Active el Bluetooth en la configuración del dispositivo para usar esta aplicación.'}
          </Text>
        </View>

        <TouchableOpacity style={styles.card} onPress={handleAbout}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Icono de Información */}
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text
              style={[styles.cardTitle, { marginLeft: 8, marginBottom: 0 }]}
            >
              Acerca de
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleHelp}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Icono de Ayuda */}
            <MaterialIcons name="help-outline" size={20} color={colors.primary} />
            <Text
              style={[styles.cardTitle, { marginLeft: 8, marginBottom: 0 }]}
            >
              Ayuda
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buttonOutline,
            { borderColor: colors.destructive, marginTop: 16 },
          ]}
          onPress={handleLogout}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Icono de Cerrar Sesión */}
            <MaterialIcons name="logout" size={20} color={colors.destructive} />
            <Text
              style={[
                styles.buttonTextSecondary,
                { marginLeft: 8, color: colors.destructive },
              ]}
            >
              Cerrar Sesión
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
