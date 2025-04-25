import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BTReaderScreen from '../screens/BTReaderScreen';
import SyncScreen     from '../screens/SyncScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MaterialIcons  from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown:false, tabBarActiveTintColor:'#0f172a' }}>
      <Tab.Screen
        name="Lectura"
        component={BTReaderScreen}
        options={{ tabBarIcon: ({color,size}) => (
          <MaterialIcons name="bluetooth" color={color} size={size} />
        )}}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{ tabBarIcon: ({color,size}) => (
          <MaterialIcons name="cloud-sync" color={color} size={size} />
        )}}
      />
      <Tab.Screen
        name="Config"
        component={SettingsScreen}
        options={{ tabBarIcon: ({color,size}) => (
          <MaterialIcons name="settings" color={color} size={size} />
        )}}
      />
    </Tab.Navigator>
  );
}
