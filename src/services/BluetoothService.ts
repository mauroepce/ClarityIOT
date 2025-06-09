import RNBluetoothClassic, {
    BluetoothDevice,
  } from 'react-native-bluetooth-classic';

  export const connectToDevice = async (
    device: BluetoothDevice,
  ): Promise<boolean> => {
    try {
      await RNBluetoothClassic.connectToDevice(device.address);
      return true;
    } catch (error) {
      console.error('Error en conexión Bluetooth:', error);
      return false;
    }
  };

  export const disconnectDevice = async (address: string): Promise<void> => {
    try {
      await RNBluetoothClassic.disconnectFromDevice(address);
    } catch (error) {
      console.error('Error al desconectar:', error);
    }
  };
