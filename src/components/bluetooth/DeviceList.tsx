// src/components/bluetooth/DeviceList.tsx
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { useTheme } from '../../contexts/ThemeContext';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

type DeviceListProps = {
  devices: BluetoothDevice[];
  onDeviceSelect: (device: BluetoothDevice) => void;
  onClose: () => void;
  isScanning: boolean;
};

export default function DeviceList({
  devices,
  onDeviceSelect,
  onClose,
  isScanning,
}: DeviceListProps) {
  const { styles, colors } = useTheme();

  const renderItem = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      style={[styles.card, { marginBottom: 8 }]}
      onPress={() => onDeviceSelect(item)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <MaterialIcons name="bluetooth" size={20} color={colors.primary} />
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.cardTitle}>{item.name || 'Sin nombre'}</Text>
          <Text style={styles.textMuted}>{item.address}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.card, { padding: 0 }]}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <Text style={styles.cardTitle}>Dispositivos Bluetooth</Text>
        <TouchableOpacity onPress={onClose}>
          <MaterialIcons name="close" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      {isScanning ? (
        <View style={{ padding: 16, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.text, { marginTop: 8 }]}>Buscando...</Text>
        </View>
      ) : (
        <FlatList
          data={devices}
          renderItem={renderItem}
          keyExtractor={item => item.address}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text style={styles.textMuted}>
                No se encontraron dispositivos
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
