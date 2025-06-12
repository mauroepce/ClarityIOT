import React, {createContext, useState, useEffect, useRef, RefObject, useCallback} from 'react';
import RNBluetoothClassic, {
  BluetoothDevice
} from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PermissionsAndroid, Platform, Alert, EmitterSubscription} from 'react-native';
import { Unit } from '../utils/weight';

type BluetoothContextType = {
  shouldReconnect: RefObject<boolean>;
  isReconnecting : boolean;
  isEnabled: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  connectedDevice: BluetoothDevice | null;
  devices: BluetoothDevice[];
  scanning: boolean;
  weightKg: number;
  unit: Unit;
  setUnit: (u: Unit) => void;
  scanForDevices: () => Promise<void>;
  connectToDevice: (device: BluetoothDevice) => Promise<boolean>;
  disconnectDevice: () => Promise<void>;
  reconnectToLastDevice: () => Promise<boolean>;
};

export const BluetoothContext = createContext<BluetoothContextType>({
  shouldReconnect: {current: true} as RefObject<boolean>,
  isReconnecting : false,
  isEnabled: false,
  isConnecting: false,
  isConnected: false,
  connectedDevice: null,
  devices: [],
  scanning: false,
  weightKg: 0,
  unit: 'kg',
  setUnit: () => {},
  scanForDevices: async () => {},
  connectToDevice: async () => false,
  disconnectDevice: async () => {},
  reconnectToLastDevice: async () => false,
});

export const BluetoothProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [weightKg, setWeightKg] = useState(0);
  const [unit, setUnit] = useState<Unit>('kg');
  const shouldReconnect = useRef(true);
  const reconnectAttempts   = useRef(0);
  const MAX_RECONNECT_TRIES = 3;
  const RETRY_COOLDOWN_MS   = 10_000;

  useEffect(() => {
    (async () => {
      const granted = await requestBluetoothPermissions();
      if (!granted) {
        Alert.alert(
          'Permiso requerido',
          'Sin permisos de Bluetooth la aplicación no puede funcionar.',
        );
        return;
      }

      let enabled = await RNBluetoothClassic.isBluetoothEnabled();
      if (!enabled) {
        enabled = await RNBluetoothClassic.requestBluetoothEnabled();
      }
      setIsEnabled(enabled);
    })();
  }, []);

  useEffect(() => {
    let sub: EmitterSubscription | null = null;

    if (isConnected && connectedDevice) {
      sub = (connectedDevice as any).onDataReceived(
        (evt: { data: string }) => {
          const match = evt.data.match(/(\d+(?:\.\d+)?)(?=\s*kg)/i);

          if (!match) {
            // No encontramos número + "kg"  →  ignoramos sin logear cada vez
            return;
          }

          const v = Number.parseFloat(match[1]);
          if (!Number.isNaN(v)) {
            setWeightKg(v);
          }
        },
      );
    }

    return () => {
      if (sub) {
        sub.remove();
        sub = null;
      }
    };
  }, [isConnected, connectedDevice]);

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      return true;
    }

    const perms = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN!,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!,
    ];

    try {
      const granted = await PermissionsAndroid.requestMultiple(perms);
      return Object.values(granted).every(
        status => status === PermissionsAndroid.RESULTS.GRANTED,
      );
    } catch (error) {
      console.warn('Error solicitando permisos Bluetooth:', error);
      return false;
    }
  };

  const scanForDevices = async () => {
    // 1) Runtime permissions
    if (!(await requestBluetoothPermissions())) {
        Alert.alert('Permisos Bluetooth no otorgados');
        return;
    }

    // 2) Comprueba y pide encender Bluetooth
    const enabledNow = await RNBluetoothClassic.isBluetoothEnabled();
    if (!enabledNow) {
        const requested = await RNBluetoothClassic.requestBluetoothEnabled();
        if (!requested) {
        Alert.alert(
            'Necesitas activar Bluetooth',
            'Por favor habilita Bluetooth para buscar dispositivos.'
        );
        return;
        }
    }
    // 3) Actualiza el estado en el contexto
    setIsEnabled(true);

    // 4) Lanza el escaneo
    setScanning(true);
    const discovered = await RNBluetoothClassic.startDiscovery();
    const bonded = await RNBluetoothClassic.getBondedDevices();
    const combined = [...discovered, ...bonded];
    const uniqueDevices = combined.filter(
      (d, i, self) => i === self.findIndex(dev => dev.address === d.address),
    );
    setDevices(uniqueDevices);
    setScanning(false);

  };

  /* ---------- connectToDevice ---------- */
  const connectToDevice = useCallback(
    async (device: BluetoothDevice) => {
      setIsConnecting(true);
      try {
        const opts: any = {
          insecure : true,
          uuid     : '00001101-0000-1000-8000-00805F9B34FB',
          DELIMITER: '\n',
        };
        await RNBluetoothClassic.connectToDevice(device.address, opts);

        /* ✅ éxito */
        setIsConnected(true);
        setConnectedDevice(device);
        shouldReconnect.current   = true;
        reconnectAttempts.current = 0;
        await AsyncStorage.setItem('moduleMAC', device.address);
        await AsyncStorage.setItem('lastDeviceAddress', device.address);
        return true;

      } catch (e: any) {
        console.error('Error conectando:', e);
          if (e?.message?.includes('socket') || e?.message?.includes('read failed')) {
            shouldReconnect.current = false;
          }
          setIsConnected(false);
          setConnectedDevice(null);
          return false;
      } finally {
        setIsConnecting(false);
      }
    },
    [],
  );

  const disconnectDevice = async () => {
    // Evitar reconexión automática
    shouldReconnect.current = false;

    if (isConnected && connectedDevice) {
      try {
        await connectedDevice.disconnect();
      } catch (error) {
        console.error('Error desconectando:', error);
      } finally {
        setIsConnected(false);
        setConnectedDevice(null);
      }
    }
  };

  const reconnectToLastDevice = useCallback(async () => {
    const lastAddress = await AsyncStorage.getItem('lastDeviceAddress');
    if (!lastAddress) {return false;}

    const bonded = await RNBluetoothClassic.getBondedDevices();
    const device = bonded.find(d => d.address === lastAddress);
    if (!device) {return false;}

    return await connectToDevice(device);
  }, [connectToDevice]);

  /* ---------- intenta reconectar ---------- */
  useEffect(() => {
    if (
      shouldReconnect.current &&
      isEnabled && !isConnected && !isConnecting &&
      reconnectAttempts.current < MAX_RECONNECT_TRIES
    ) {
      setIsReconnecting(true);                 // 👈
      reconnectAttempts.current += 1;
      reconnectToLastDevice()
        .finally(() => {
          setIsReconnecting(false);            // 👈
          if (!isConnected) {
            setTimeout(() => {}, RETRY_COOLDOWN_MS);
          } else {
            reconnectAttempts.current = 0;
          }
        });
    }
  }, [isEnabled, isConnected, isConnecting, reconnectToLastDevice]);

  return (
    <BluetoothContext.Provider
      value={{
        isReconnecting,
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
      }}>
      {children}
    </BluetoothContext.Provider>
  );
};
