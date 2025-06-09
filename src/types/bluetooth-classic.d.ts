import 'react-native-bluetooth-classic';
import { EmitterSubscription } from 'react-native';

declare module 'react-native-bluetooth-classic' {
  interface BluetoothModule {

    onDataReceived(
      listener: (e: { data: string; device: string }) => void
    ): EmitterSubscription;
  }
}
