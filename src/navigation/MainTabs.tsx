import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MaterialIcons              from 'react-native-vector-icons/MaterialIcons';

import BTReaderScreen  from '../screens/BTReaderScreen';
import SyncScreen      from '../screens/SyncScreen';
import SettingsScreen  from '../screens/SettingsScreen';
import {useTheme}      from '../contexts/ThemeContext';

export default function MainTabs() {
  /* ✅ hook dentro del componente */
  const {colors} = useTheme();
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor  : colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor : colors.border,
        },
      }}>
      <Tab.Screen
        name="Lectura"
        component={BTReaderScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="bluetooth" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            /* “sync” existe en MaterialIcons; “cloud-sync” no */
            <MaterialIcons name="sync" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Config"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({color, size}) => (
            <MaterialIcons name="settings" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
