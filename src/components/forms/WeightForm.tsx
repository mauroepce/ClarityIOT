import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useTheme } from '../../contexts/ThemeContext';
import { Unit, UNIT_LABEL } from '../../utils/weight';

export type FormData = {
  quantity: number;
  folio: string;
  transaction: string;
  product: string;
  container: string;
  caliber: string;
  notes?: string;
  timestamp: string;
  unit: Unit;
};

const UNITS: Unit[] = ['kg', 't', 'lb', 'oz'];
const TRANSACTIONS = ['CAMARA', 'COMPRA', 'INVENTARIO', 'PROCESO', 'SERVICIO', 'VENTA'];
const PRODUCTS     = ['Manzana', 'Naranja', 'Plátano', 'Pera'];
const CONTAINERS   = ['Caja', 'Bolsa', 'Pallet'];
const CALIBERS     = ['Pequeño', 'Mediano', 'Grande'];

type Props = {
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
};

export default function WeightForm({ onSubmit, onCancel }: Props) {
  const { styles, colors } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [form, setForm] = useState<FormData>({
    quantity: 1,
    folio: '',
    transaction: TRANSACTIONS[0],
    product: PRODUCTS[0],
    container: CONTAINERS[0],
    caliber: CALIBERS[0],
    notes: '',
    timestamp: new Date().toISOString(),
    unit: 'kg',
  });

  const handle = (k: keyof FormData, v: any) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const save = () => {
    if (!form.folio.trim()) {
      Alert.alert('Error', 'El campo folio es obligatorio');
      return;
    }
    onSubmit(form);
  };

  /** Componente Picker reutilizable */
  const renderPicker = (label: string, field: keyof FormData, items: string[]) => (
    <>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 16 }}>
        <Picker
          selectedValue={form[field] as string}
          onValueChange={val => handle(field, val)}>
          {items.map(it => (
            <Picker.Item key={it} label={it} value={it} />
          ))}
        </Picker>
      </View>
    </>
  );

  return (
    <View style={[styles.card, { padding: 0 }]}>
      {/* encabezado */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Text style={styles.cardTitle}>Registrar Peso</Text>
        <TouchableOpacity onPress={onCancel}>
          <MaterialIcons name="close" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Unidad */}
        <Text style={styles.inputLabel}>Unidad</Text>
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 16 }}>
          <Picker
            selectedValue={form.unit}
            onValueChange={val => handle('unit', val as Unit)}>
            {UNITS.map(u => (
              <Picker.Item key={u} label={UNIT_LABEL[u]} value={u} />
            ))}
          </Picker>
        </View>

        {/* Folio y Cantidad */}
        <Text style={styles.inputLabel}>Folio *</Text>
        <TextInput
          style={styles.input}
          value={form.folio}
          onChangeText={t => handle('folio', t)}
        />

        <Text style={styles.inputLabel}>Cantidad *</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={String(form.quantity)}
          onChangeText={t => handle('quantity', parseInt(t) || 0)}
        />

        {/* Pickers */}
        {renderPicker('Transacción *', 'transaction', TRANSACTIONS)}
        {renderPicker('Producto *',     'product',     PRODUCTS)}
        {renderPicker('Contenedor *',   'container',   CONTAINERS)}
        {renderPicker('Calibre *',      'caliber',     CALIBERS)}

        {/* Notas */}
        <Text style={styles.inputLabel}>Notas</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          multiline
          value={form.notes}
          onChangeText={t => handle('notes', t)}
        />

        {/* Fecha y hora */}
        <Text style={styles.inputLabel}>Fecha y Hora</Text>
        <TouchableOpacity
          style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, backgroundColor: colors.background, marginBottom: 16 }}
          onPress={() => setShowDatePicker(true)}>
          <Text>{new Date(form.timestamp).toLocaleString()}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(form.timestamp)}
            mode="datetime"
            display="default"
            onChange={(event, d) => {
              setShowDatePicker(false);
              if (d) handle('timestamp', d.toISOString());
            }}
          />
        )}

        {/* botones */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[styles.buttonOutline, { flex: 1, marginRight: 8 }]} onPress={onCancel}>
            <Text style={styles.buttonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.buttonPrimary, { flex: 1 }]} onPress={save}>
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
