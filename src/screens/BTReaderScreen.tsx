// src/screens/BTReaderScreen.tsx
import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {BluetoothContext} from '../contexts/BluetoothContext';
import {SyncContext} from '../contexts/SyncContext';
import {useTheme} from '../contexts/ThemeContext';
import {convertWeight, UNIT_LABEL, UNITS} from '../utils/weight';
import DeviceList from '../components/bluetooth/DeviceList';
import WeightForm from '../components/forms/WeightForm';

export default function BTReaderScreen() {
  const {
    isEnabled,
    isConnecting,
    isConnected,
    connectedDevice,
    devices,
    scanning,
    weightKg,
    unit,
    setUnit,
    shouldReconnect,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
    reconnectToLastDevice,
  } = useContext(BluetoothContext);

  const {addRecord} = useContext(SyncContext);
  const {styles, colors} = useTheme();

  const [showDeviceList, setShowDeviceList] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [unitModal, setUnitModal] = useState(false);

  /* ---------- reconexión ---------- */
  useEffect(() => {
    if (shouldReconnect.current && isEnabled && !isConnected && !isConnecting) {
      reconnectToLastDevice();
    }
  }, [isEnabled, isConnected, isConnecting, reconnectToLastDevice, shouldReconnect]);

  /* ---------- abre form con dato válido ---------- */
  useEffect(() => {
    if (weightKg > 0 && isConnected) setShowForm(true);
  }, [weightKg, isConnected]);

  /* ---------- helpers ---------- */
  const btStatus = () => {
    if (!isEnabled)
      return <Text style={{color: colors.destructive}}>Bluetooth desactivado</Text>;
    if (isConnecting)
      return <ActivityIndicator size="small" color={colors.primary} />;
    if (isConnected && connectedDevice)
      return <Text style={{color: colors.primary}}>Conectado a {connectedDevice.name}</Text>;
    if (scanning)
      return <Text style={{color: colors.primary}}>Buscando dispositivos…</Text>;
    return <Text style={{color: colors.mutedForeground}}>No conectado</Text>;
  };

  /* ---------- UI ---------- */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Lector de Peso Bluetooth</Text>
        {btStatus()}

        {/* ---------------- estado CONECTADO ---------------- */}
        {isConnected ? (
          <View style={styles.card}>
            {/* peso en vivo – tap para cambiar unidad */}
            <Pressable onPress={() => setUnitModal(true)}>
              <Text style={styles.weightDisplay}>
                {convertWeight(weightKg, unit)} {unit.toUpperCase()}
              </Text>
            </Pressable>

            <TouchableOpacity style={styles.buttonOutline} onPress={disconnectDevice}>
              <Text style={styles.buttonTextSecondary}>Desconectar</Text>
            </TouchableOpacity>

            {!showForm && (
              <TouchableOpacity
                style={[styles.buttonPrimary, {marginTop: 16}]}
                onPress={() => setShowForm(true)}>
                <Text style={styles.buttonText}>Registrar Peso</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          /* ---------------- estado NO conectado ---------------- */
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={async () => {
              if (!isEnabled) {
                Alert.alert('Bluetooth desactivado', 'Active Bluetooth en el sistema');
                return;
              }
              setShowDeviceList(true);
              await scanForDevices();
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <MaterialIcons name="search" size={20} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, {marginLeft: 8}]}>
                Buscar Dispositivos
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* listado de dispositivos */}
        {showDeviceList && (
          <DeviceList
            devices={devices}
            isScanning={scanning}
            onDeviceSelect={async d => {
              const ok = await connectToDevice(d);
              if (ok) setShowDeviceList(false);
              else Alert.alert('Error', 'No se pudo conectar');
            }}
            onClose={() => setShowDeviceList(false)}
          />
        )}

        {/* formulario */}
        {showForm && (
          <WeightForm
            onSubmit={async d => {
              await addRecord({...d, weight: weightKg, unit});
              Alert.alert('Éxito', 'Registro guardado');
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </ScrollView>

      {/* ---------- Bottom-sheet para unidad ---------- */}
      <Modal visible={unitModal} transparent animationType="fade">
        {/* overlay (cierra al tocar fuera) */}
        <TouchableWithoutFeedback onPress={() => setUnitModal(false)}>
          <View style={{flex: 1, backgroundColor: '#00000055'}} />
        </TouchableWithoutFeedback>

        {/* hoja inferior */}
        <View
          style={{
            backgroundColor: colors.card,
            paddingBottom: 12,
            paddingTop: 8,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}>
          {UNITS.map(u => (
            <Pressable
              key={u}
              onPress={() => {
                setUnit(u);
                setUnitModal(false);
              }}
              style={{padding: 16}}>
              <Text
                style={{
                  fontSize: 18,
                  color: u === unit ? colors.primary : colors.foreground,
                  fontWeight: u === unit ? '700' : '400',
                }}>
                {UNIT_LABEL[u]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}
