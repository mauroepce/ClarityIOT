// src/screens/SettingsScreen.tsx
import React, {useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import {AppContext}      from '../contexts/AppContext';
import {BluetoothContext} from '../contexts/BluetoothContext';
import {useTheme}         from '../contexts/ThemeContext';

export default function SettingsScreen() {
  /* --- contextos --- */
  const {logout, user}   = useContext(AppContext);
  const {isEnabled}      = useContext(BluetoothContext);
  const {styles, colors, isDark, toggleTheme} = useTheme();

  /* --- acciones --- */
  const handleLogout = () =>
    Alert.alert('Cerrar Sesión', '¿Está seguro de que desea salir?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Salir', style: 'destructive', onPress: logout},
    ]);

  const handleAbout = () =>
    Alert.alert(
      'Acerca de',
      'Clarity-IOT v1.0\nApp para lectura de sensores de peso Bluetooth',
      [{text: 'OK'}],
    );

  const handleHelp = () =>
    Alert.alert(
      'Ayuda',
      '1. Conecte un dispositivo Bluetooth.\n2. Lea el peso y complete el formulario.\n3. Sincronice cuando tenga Internet.',
      [{text: 'OK'}],
    );

  /* --- UI --- */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Configuración</Text>

        {/* ---- Usuario ---- */}
        {user && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información de Usuario</Text>
            <Text style={styles.text}>Usuario: {user.username}</Text>
          </View>
        )}

        {/* ---- Bluetooth ---- */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bluetooth</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialIcons
                name="bluetooth"
                size={20}
                color={isEnabled ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.text, {marginLeft: 8}]}>Estado Bluetooth</Text>
            </View>
            <Text style={{color: isEnabled ? colors.primary : colors.destructive}}>
              {isEnabled ? 'Activado' : 'Desactivado'}
            </Text>
          </View>
        </View>

        {/* ---- Tema oscuro ---- */}
        <View
          style={[
            styles.card,
            {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
          ]}>
          <Text style={styles.cardTitle}>Tema oscuro</Text>

          <TouchableOpacity
            style={[
              styles.buttonOutline,
              {borderColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6},
            ]}
            onPress={toggleTheme}>
            <Text
              style={[
                styles.buttonTextSecondary,
                {color: colors.primary},
              ]}>
              {isDark ? 'Desactivar' : 'Activar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ---- Info & ayuda ---- */}
        <TouchableOpacity style={styles.card} onPress={handleAbout}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialIcons name="info" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, {marginLeft: 8, marginBottom: 0}]}>
              Acerca de
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleHelp}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialIcons name="help-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, {marginLeft: 8, marginBottom: 0}]}>
              Ayuda
            </Text>
          </View>
        </TouchableOpacity>

        {/* ---- Salir ---- */}
        <TouchableOpacity
          style={[styles.buttonOutline, {borderColor: colors.destructive, marginTop: 16}]}
          onPress={handleLogout}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <MaterialIcons name="logout" size={20} color={colors.destructive} />
            <Text
              style={[
                styles.buttonTextSecondary,
                {marginLeft: 8, color: colors.destructive},
              ]}>
              Cerrar Sesión
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
