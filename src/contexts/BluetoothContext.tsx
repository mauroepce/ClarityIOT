import React, {createContext, useState, useEffect, useRef, RefObject} from 'react';
import RNBluetoothClassic, {
  BluetoothDevice,
} from 'react-native-bluetooth-classic';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PermissionsAndroid, Platform, Alert} from 'react-native';
import { Unit } from '../utils/weight';

type BluetoothContextType = {
  shouldReconnect: RefObject<boolean>;
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
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [scanning, setScanning] = useState(false);
  const [weightKg, setWeightKg] = useState(0);
  const [unit, setUnit] = useState<Unit>('kg');
  const shouldReconnect = useRef(true);

  useEffect(() => {
    const checkBluetoothEnabled = async () => {
      const enabled = await RNBluetoothClassic.isBluetoothEnabled();
      setIsEnabled(enabled);
      if(!enabled) {
        await RNBluetoothClassic.requestBluetoothEnabled();
        // Forzamos que isEnabled sea true
        setIsEnabled(true);
      }
      console.log('Bluetooth enabled:', enabled);
    };
    checkBluetoothEnabled();

    const interval = setInterval(async () => {
      if (isEnabled && isConnected && connectedDevice) {
        // Leer datos cada 500ms
        try {
          const data = await connectedDevice.read();
          if (data) {
            setWeightKg(parseFloat(data.trim()) || 0);
          }
        } catch (e: any) {
          console.error('Error leyendo datos:', e);
          if (e?.code === 'BLUETOOTH_NOT_ENABLED') {
            setIsEnabled(false);
          }
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isConnected, connectedDevice, isEnabled]);

  const requestBluetoothPermissions = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      // iOS no requiere estos permisos en tiempo de ejecución
      return true;
    }

    // Construimos el array de permisos según la versión de Android
    const perms = [
      // En Android 12+ (API 31+)
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN!,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!,
      // Ubicación (requiere para escaneo en muchos dispositivos)
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!,
    ];

    try {
      // Pedimos todos los permisos de una sola vez
      const granted = await PermissionsAndroid.requestMultiple(perms);

      // granted es un objeto { [perm]: 'granted' | 'denied' | 'never_ask_again' }
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

  const connectToDevice = async (device: BluetoothDevice) => {
    setIsConnecting(true);
    try {
      /* 1️⃣ bond si aún no lo está */
      if (!device.bonded) {
        await RNBluetoothClassic.pairDevice(device.address);
      }

      /* 2️⃣ conexión explícita (insecure + UUID SPP) */
      await RNBluetoothClassic.connectToDevice(device.address, {
        connectorType: 'rfcomm',   // opcional – 'rfcomm' es el valor por defecto
        secureSocket : false,      // abre el socket “inseguro”
        delimiter    : '\n',       // para readUntil / onDataRead
      });

      /* 3️⃣ estado */
      setIsConnected(true);
      setConnectedDevice(device);
      shouldReconnect.current = true;
      await AsyncStorage.setItem('lastDeviceAddress', device.address);
      return true;
    } catch (e) {
      console.error('Error conectando:', e);
      /* mensaje visible para el usuario */
      Alert.alert(
        'Conexión fallida',
        'No se pudo abrir el socket Bluetooth. Verifica que el sensor esté encendido y emparejado.'
      );
      setIsConnected(false);
      setConnectedDevice(null);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

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

  const reconnectToLastDevice = async () => {
    const lastAddress = await AsyncStorage.getItem('lastDeviceAddress');
    if (!lastAddress) {
      return false;
    }

    // Buscar el dispositivo en los emparejados
    const bonded = await RNBluetoothClassic.getBondedDevices();
    const device = bonded.find(d => d.address === lastAddress);
    if (!device) {
      return false;
    }

    return await connectToDevice(device);
  };

  return (
    <BluetoothContext.Provider
      value={{
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
