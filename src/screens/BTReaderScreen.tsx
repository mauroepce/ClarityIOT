import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { BluetoothContext } from '../contexts/BluetoothContext';
import { SyncContext }     from '../contexts/SyncContext';
import { useTheme }        from '../contexts/ThemeContext';
import { convertWeight, Unit, UNIT_LABEL } from '../utils/weight';

import DeviceList  from '../components/bluetooth/DeviceList';
import WeightForm  from '../components/forms/WeightForm';

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

  const { addRecord }      = useContext(SyncContext);
  const { styles, colors } = useTheme();

  const [showDeviceList, setShowDeviceList] = useState(false);
  const [showForm,       setShowForm]       = useState(false);

  /* ------------ reconexión automática ------------ */
  useEffect(() => {
    const go = async () => {
      if (shouldReconnect.current && isEnabled && !isConnected && !isConnecting) {
        await reconnectToLastDevice();
      }
    };
    go();
  }, [isEnabled, isConnected, isConnecting, reconnectToLastDevice, shouldReconnect]);

  /* abre el formulario cuando llega un peso válido */
  useEffect(() => {
    if (weightKg > 0 && isConnected) setShowForm(true);
  }, [weightKg, isConnected]);

  /* ------------ handlers ------------ */
  const handleScan = async () => {
    if (!isEnabled) {
      Alert.alert('Bluetooth desactivado', 'Activa Bluetooth en tu dispositivo.');
      return;
    }
    setShowDeviceList(true);
    await scanForDevices();
  };

  const handleDeviceSelect = async (device: any) => {
    const ok = await connectToDevice(device);
    if (!ok) Alert.alert('Error', 'No se pudo conectar.');
    else     setShowDeviceList(false);
  };

  const handleFormSubmit = async (data: any) => {
    await addRecord({ ...data, weight: weightKg, unit });
    Alert.alert('Éxito', 'Registro guardado.');
    setShowForm(false);
  };

  /* ------------ UI auxiliares ------------ */
  const renderBluetoothStatus = () => {
    if (!isEnabled)        return <Text style={{ color: colors.destructive }}>Bluetooth desactivado</Text>;
    if (isConnecting)      return <ActivityIndicator size="small" color={colors.primary} />;
    if (isConnected && connectedDevice)
      return <Text style={{ color: colors.primary }}>Conectado a {connectedDevice.name}</Text>;
    if (scanning)          return <Text style={{ color: colors.primary }}>Buscando dispositivos…</Text>;
    return <Text style={{ color: colors.mutedForeground }}>No conectado</Text>;
  };

  /* ------------ render ------------ */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Lector de Peso Bluetooth</Text>
        {renderBluetoothStatus()}

        {isConnected ? (
          <View style={styles.card}>
            {/* selector de unidad */}
            <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 16 }}>
              <Picker
                selectedValue={unit}
                onValueChange={u => setUnit(u as Unit)}>
                {(['kg', 't', 'lb', 'oz'] as Unit[]).map(u => (
                  <Picker.Item key={u} label={UNIT_LABEL[u]} value={u} />
                ))}
              </Picker>
            </View>

            {/* peso en vivo */}
            <Text style={styles.cardTitle}>Peso</Text>
            <Text style={styles.weightDisplay}>
              {convertWeight(weightKg, unit)}
            </Text>

            <TouchableOpacity style={styles.buttonOutline} onPress={disconnectDevice}>
              <Text style={styles.buttonTextSecondary}>Desconectar</Text>
            </TouchableOpacity>

            {!showForm && (
              <TouchableOpacity
                style={[styles.buttonPrimary, { marginTop: 16 }]}
                onPress={() => setShowForm(true)}>
                <Text style={styles.buttonText}>Registrar Peso</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <TouchableOpacity style={styles.buttonPrimary} onPress={handleScan}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="search" size={20} color={colors.primaryForeground} />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>Buscar Dispositivos</Text>
            </View>
          </TouchableOpacity>
        )}

        {showDeviceList && (
          <DeviceList
            devices={devices}
            onDeviceSelect={handleDeviceSelect}
            onClose={() => setShowDeviceList(false)}
            isScanning={scanning}
          />
        )}

        {showForm && (
          <WeightForm
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}
      </ScrollView>
    </View>
  );
}
