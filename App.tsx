// App.tsx
import 'react-native-gesture-handler';
import React from 'react';
import {StatusBar} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer}    from '@react-navigation/native';
import {SafeAreaProvider}      from 'react-native-safe-area-context';

import {ThemeProvider, useTheme} from './src/contexts/ThemeContext';
import {AppContextProvider}      from './src/contexts/AppContext';
import {BluetoothProvider}       from './src/contexts/BluetoothContext';
import {SyncProvider}            from './src/contexts/SyncContext';
import AppNavigator              from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContextProvider>
            <BluetoothProvider>
              <SyncProvider>
                <InnerApp />
              </SyncProvider>
            </BluetoothProvider>
          </AppContextProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/* ---- componente que YA conoce el tema ---- */
function InnerApp() {
  const {colors, isDark} = useTheme();

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </>
  );
}
