import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { NavigationProp, useNavigation } from '@react-navigation/native';

import { BluetoothContext } from '../contexts/BluetoothContext';
import { SyncContext }      from '../contexts/SyncContext';
import { useTheme }         from '../contexts/ThemeContext';
import { convertWeight, UNIT_LABEL, UNITS } from '../utils/weight';
import DeviceList   from '../components/bluetooth/DeviceList';
import WeightForm   from '../components/forms/WeightForm';
import MessageModal from '../components/ui/MessageModal';
import { BluetoothDevice } from 'react-native-bluetooth-classic';
import { CatalogContext } from '../contexts/CatalogContext';
import { WeightRecord } from '../types';

/* ——— rutas que vamos a navegar desde aquí ——— */
type RootStackParamList = {
  Sync : { openTab?: 'pending' | 'synced' };
};

export default function BTReaderScreen() {
  /* BLUETOOTH */
  const bt = useContext(BluetoothContext);

  /* SYNC */
  const { addRecord, isOnline } = useContext(SyncContext);
  const { lookup } = useContext(CatalogContext);

  /* UI local */
  const { styles, colors } = useTheme();
  const nav = useNavigation<NavigationProp<RootStackParamList>>();

  const [showDeviceList, setShowDeviceList] = useState(false);
  const [showForm,       setShowForm]       = useState(false);
  const [unitModal,      setUnitModal]      = useState(false);
  const [lastConnectError, setLastConnectError] = useState<string | null>(null);

  type ModalState =
    | { show: false }
    | { show: true; type: 'success' | 'error'; msg: string };
  const [modal, setModal] = useState<ModalState>({ show: false });

  /* ---------- helpers ---------- */
  const btStatus = () => {
    if (!bt.isEnabled)
      {return <Text style={{ color: colors.destructive }}>Bluetooth desactivado</Text>;}
    if (bt.isReconnecting)
      {return <Text style={{ color: colors.primary }}>Reintentando…</Text>;}
    if (bt.isConnecting)
      {return <ActivityIndicator size="small" color={colors.primary} />;}
    if (bt.isConnected && bt.connectedDevice)
      {return (
        <Text style={{ color: colors.primary }}>
          Conectado a {bt.connectedDevice.name}
        </Text>
      );}
    if (bt.scanning)
      {return <Text style={{ color: colors.primary }}>Buscando dispositivos…</Text>;}
    return <Text style={{ color: colors.mutedForeground }}>No conectado</Text>;
  };

  const handleDeviceSelect = async (d: BluetoothDevice) => {
    const ok = await bt.connectToDevice(d);
    if (ok) {
      setShowDeviceList(false);
      setLastConnectError(null);
    } else {
      setLastConnectError(
        'No se pudo abrir el socket bluetooth.\nVerifica que el sensor esté encendido y emparejado.',
      );
    }
  };

  /* ---------- efectos ---------- */
  useEffect(() => {
    // reconexión automática
    if (
      bt.shouldReconnect.current &&
      bt.isEnabled &&
      !bt.isConnected &&
      !bt.isConnecting
    ) {
      bt.reconnectToLastDevice();
    }
  }, [bt]);

  // abre el formulario al llegar la primera lectura válida
  useEffect(() => {
    if (bt.weightKg > 0 && bt.isConnected) {setShowForm(true);}
  }, [bt.weightKg, bt.isConnected]);

  // alerta de error de conexión BT
  useEffect(() => {
    if (lastConnectError) {
      Alert.alert('Conexión fallida', lastConnectError, [
        { text: 'OK', onPress: () => setLastConnectError(null) },
      ]);
    }
  }, [lastConnectError]);

  /* ---------- UI ---------- */
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.h1}>Lector de Peso Bluetooth</Text>
        {btStatus()}

        {/* -------- CONECTADO -------- */}
        {bt.isConnected ? (
          <View style={styles.card}>
            <Pressable onPress={() => setUnitModal(true)}>
              <Text style={styles.weightDisplay}>
                {convertWeight(bt.weightKg, bt.unit)} {bt.unit.toUpperCase()}
              </Text>
            </Pressable>

            <TouchableOpacity
              style={styles.buttonOutline}
              onPress={bt.disconnectDevice}>
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
          /* -------- NO conectado -------- */
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={async () => {
              if (!bt.isEnabled) {
                Alert.alert(
                  'Bluetooth desactivado',
                  'Active Bluetooth en el sistema',
                );
                return;
              }
              setShowDeviceList(true);
              await bt.scanForDevices();
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons
                name="search"
                size={20}
                color={colors.primaryForeground}
              />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                Buscar Dispositivos
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* listado de dispositivos */}
        {showDeviceList && (
          <DeviceList
            devices={bt.devices}
            isScanning={bt.scanning}
            onDeviceSelect={handleDeviceSelect}
            onClose={() => setShowDeviceList(false)}
          />
        )}

        {/* formulario */}
        {showForm && (
          <WeightForm
            onSubmit={async d => {
              if (bt.weightKg <= 0) {
                setModal({ show:true, type:'error', msg:'No se recibió un peso válido' });
                return;
              }
              try {
                const safe = (m: Record<string, string>, lbl: string): string => m[lbl] ?? lbl;
                const payload = {
                  ...d,
                  weight: bt.weightKg,
                  unit  : bt.unit,

                  transactionId : safe(lookup.transaccion, d.transaction),
                  productId     : safe(lookup.producto,    d.product),
                  subproductId  : safe(lookup.subproducto, d.subproduct),
                  boxId         : safe(lookup.caja,        d.box),
                  caliberId     : safe(lookup.calibre,     d.caliber),
                  originId      : safe(lookup.origen,      d.origin),
                  processId     : safe(lookup.proceso,     d.process),
                } satisfies Omit<WeightRecord,'id'|'synced'>;

                await addRecord(payload);

                setModal({ show:true, type:'success', msg:'Registro guardado' });

                setShowForm(false);

              } catch (err) {
                console.log('[BT] ❌ onSubmit — error en addRecord o syncAllNow →', err);
                setModal({ show:true, type:'error', msg:'No se pudo guardar el registro' });
              }
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </ScrollView>

      {/* ---------- selector de unidad ---------- */}
      <Modal visible={unitModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setUnitModal(false)}>
          <View style={{ flex: 1, backgroundColor: '#00000055' }} />
        </TouchableWithoutFeedback>
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
                bt.setUnit(u);
                setUnitModal(false);
              }}
              style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize: 18,
                  color: u === bt.unit ? colors.primary : colors.foreground,
                  fontWeight: u === bt.unit ? '700' : '400',
                }}>
                {UNIT_LABEL[u]}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>

      {/* ---------- modal éxito / error ---------- */}
      <MessageModal
        visible={modal.show}
        type={modal.show ? modal.type : 'success'}
        message={modal.show ? modal.msg : ''}
        onClose={() => {
          // cierro el modal primero
          setModal({ show: false });

          // decido el tab destino UNA sola vez
          const targetTab: 'pending' | 'synced' = isOnline ? 'synced' : 'pending';

          // navego en el siguiente tick (evita interacción modal/navegación)
          setTimeout(() => {
            nav.navigate('Sync', { openTab: targetTab });
          }, 50);
        }}
      />
    </View>
  );
}
