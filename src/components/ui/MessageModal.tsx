import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';

type Props = {
  visible : boolean;
  type    : 'success' | 'error';
  message : string;
  onClose : () => void;
};

export default function MessageModal({ visible, type, message, onClose }: Props) {
    const { colors } = useTheme();
  const color = type === 'success' ? colors.primary : colors.destructive;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1, justifyContent: 'center', alignItems: 'center',
          backgroundColor: '#00000055',
        }}>
        <View
          style={{
            backgroundColor: '#fff',
            width: '80%',
            padding: 24,
            borderRadius: 16,
            alignItems: 'center',
          }}>
          <MaterialIcons
            name={type === 'success' ? 'check-circle' : 'error'}
            size={48}
            color={color}
          />
          <Text style={{ fontSize: 16, textAlign: 'center', marginVertical: 12 }}>
            {message}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: color,
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 8,
            }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
