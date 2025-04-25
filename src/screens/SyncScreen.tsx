import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { SyncContext, WeightRecord } from '../contexts/SyncContext';
import { useTheme }                  from '../contexts/ThemeContext';
import { convertWeight }             from '../utils/weight';

export default function SyncScreen() {
  /* ---- datos desde el contexto ---- */
  const {
    pending,
    synced,
    isSyncing,
    isOnline,
    syncAll,
    clearSynced,
  } = useContext(SyncContext);

  const { styles, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'pending' | 'synced'>('pending');

  /* ---- acciones ---- */
  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert('Sin conexión', 'Necesitas Internet para sincronizar.', [{ text: 'OK' }]);
      return;
    }
    if (pending.length === 0) {
      Alert.alert('Nada que enviar', 'No hay registros pendientes.', [{ text: 'OK' }]);
      return;
    }
    try {
      await syncAll();
      Alert.alert('Éxito', 'Registros sincronizados.');
    } catch {
      Alert.alert('Error', 'Falló la sincronización. Intenta de nuevo.');
    }
  };

  const handleClearSynced = () => {
    if (synced.length === 0) {
      Alert.alert('Vacío', 'No hay registros sincronizados para borrar.', [{ text: 'OK' }]);
      return;
    }
    Alert.alert('Confirmar', '¿Eliminar registros sincronizados?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: clearSynced },
    ]);
  };

  /* ---- render de cada fila ---- */
  const renderItem = ({ item }: { item: WeightRecord }) => (
    <View style={styles.card}>
      {/* encabezado: folio + estado */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={styles.cardTitle}>Folio: {item.folio}</Text>
        {item.synced ? (
          <MaterialIcons name="check" size={20} color="green" />
        ) : (
          <MaterialIcons name="cloud_off" size={20} color={colors.mutedForeground} />
        )}
      </View>

      {/* detalle */}
      <View style={{ marginBottom: 8 }}>
        <Text style={styles.text}>
          Peso:{' '}
          <Text style={{ fontWeight: 'bold' }}>
            {convertWeight(item.weight, item.unit as any)}
          </Text>
        </Text>
        <Text style={styles.text}>Cantidad: {item.quantity}</Text>
        <Text style={styles.text}>Producto: {item.product}</Text>
        <Text style={styles.text}>Transacción: {item.transaction}</Text>
        <Text style={styles.text}>Contenedor: {item.container}</Text>
        <Text style={styles.text}>Calibre: {item.caliber}</Text>
        {item.notes ? <Text style={styles.text}>Notas: {item.notes}</Text> : null}
      </View>

      <Text style={styles.textMuted}>
        {new Date(item.timestamp).toLocaleString()}
      </Text>
    </View>
  );

  /* ---- UI ---- */
  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingBottom: 0 }]}>
        <Text style={styles.h1}>Sincronización</Text>

        {/* indicador de red */}
        <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
          {isOnline ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="cloud" size={20} color="green" />
              <Text style={{ marginLeft: 8, color: 'green' }}>Conectado</Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="cloud_off" size={20} color={colors.destructive} />
              <Text style={{ marginLeft: 8, color: colors.destructive }}>Sin conexión</Text>
            </View>
          )}
        </View>

        {/* botones */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <TouchableOpacity
            style={[
              styles.buttonPrimary,
              { flex: 1, marginRight: 8, opacity: isSyncing ? 0.7 : 1 },
            ]}
            onPress={handleSync}
            disabled={isSyncing || !isOnline || pending.length === 0}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isSyncing ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <MaterialIcons name="autorenew" size={20} color={colors.primaryForeground} />
              )}
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonOutline, { flex: 1 }]}
            onPress={handleClearSynced}
            disabled={synced.length === 0}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="delete" size={20} color={colors.destructive} />
              <Text
                style={[
                  styles.buttonTextSecondary,
                  { marginLeft: 8, color: colors.destructive },
                ]}>
                Limpiar
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* pestañas */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: activeTab === 'pending' ? colors.primary : colors.secondary,
              borderTopLeftRadius: 8,
              borderBottomLeftRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setActiveTab('pending')}>
            <Text
              style={{
                color: activeTab === 'pending' ? colors.primaryForeground : colors.secondaryForeground,
                fontWeight: '500',
              }}>
              Pendientes ({pending.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              flex: 1,
              padding: 12,
              backgroundColor: activeTab === 'synced' ? colors.primary : colors.secondary,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
              alignItems: 'center',
            }}
            onPress={() => setActiveTab('synced')}>
            <Text
              style={{
                color: activeTab === 'synced' ? colors.primaryForeground : colors.secondaryForeground,
                fontWeight: '500',
              }}>
              Sincronizados ({synced.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* listado */}
      <FlatList
        data={activeTab === 'pending' ? pending : synced}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={styles.textMuted}>
              {activeTab === 'pending'
                ? 'No hay registros pendientes'
                : 'No hay registros sincronizados'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
