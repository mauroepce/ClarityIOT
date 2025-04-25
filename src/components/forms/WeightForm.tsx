import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Pressable,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useTheme} from '../../contexts/ThemeContext';
import {Unit} from '../../utils/weight';

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

/* ---------------- catálogos ---------------- */
const TRANSACTIONS = ['CAMARA', 'COMPRA', 'INVENTARIO', 'PROCESO', 'SERVICIO', 'VENTA'];
const PRODUCTS     = ['Manzana', 'Naranja', 'Plátano', 'Pera'];
const CONTAINERS   = ['Caja', 'Bolsa', 'Pallet'];
const CALIBERS     = ['Pequeño', 'Mediano', 'Grande'];

type Props = {onSubmit: (d: FormData) => void; onCancel: () => void};

export default function WeightForm({onSubmit, onCancel}: Props) {
  const {styles, colors} = useTheme();

  /* ---------------- estado principal ---------------- */
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

  /* ---------------- hoja inferior genérica ---------------- */
  const [sheet, setSheet] = useState<{
    visible: boolean;
    field: keyof FormData | null;
    options: string[];
  }>({visible: false, field: null, options: []});

  const openSheet = (field: keyof FormData, options: string[]) =>
    setSheet({visible: true, field, options});

  const closeSheet = () => setSheet({visible: false, field: null, options: []});

  /* ---------------- helpers ---------------- */
  const handle = (k: keyof FormData, v: any) =>
    setForm(prev => ({...prev, [k]: v}));

  const save = () => {
    if (!form.folio.trim()) {
      Alert.alert('Error', 'El campo folio es obligatorio');
      return;
    }
    onSubmit(form);
  };

  /** Input + botón que abre la hoja */
  const Selector = ({
    label,
    field,
    options,
  }: {
    label: string;
    field: keyof FormData;
    options: string[];
  }) => (
    <>
      <Text style={styles.inputLabel}>{label}</Text>
      <TouchableOpacity
        onPress={() => openSheet(field, options)}
        style={{
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}>
        <Text style={{color: colors.foreground}}>{form[field]}</Text>
      </TouchableOpacity>
    </>
  );

  /* ---------------- UI ---------------- */
  return (
    <View style={[styles.card, {padding: 0}]}>
      {/* ---------- encabezado ---------- */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
        <Text style={styles.cardTitle}>Registrar Peso</Text>
        <TouchableOpacity onPress={onCancel}>
          <MaterialIcons name="close" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{padding: 16}}>
        {/* Folio / Cantidad */}
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

        {/* Selectores con hoja inferior */}
        <Selector label="Transacción *" field="transaction" options={TRANSACTIONS} />
        <Selector label="Producto *"     field="product"     options={PRODUCTS} />
        <Selector label="Contenedor *"   field="container"   options={CONTAINERS} />
        <Selector label="Calibre *"      field="caliber"     options={CALIBERS} />

        {/* Notas */}
        <Text style={styles.inputLabel}>Notas</Text>
        <TextInput
          style={[styles.input, {height: 100, textAlignVertical: 'top'}]}
          multiline
          value={form.notes}
          onChangeText={t => handle('notes', t)}
        />

        {/* Fecha & hora */}
        <Text style={styles.inputLabel}>Fecha y Hora</Text>
        <TouchableOpacity
          style={{
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
          onPress={() => setShowDatePicker(true)}>
          <Text>{new Date(form.timestamp).toLocaleString()}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(form.timestamp)}
            mode="datetime"
            display="default"
            onChange={(_, d) => {
              setShowDatePicker(false);
              if (d) {handle('timestamp', d.toISOString());}
            }}
          />
        )}

        {/* botones */}
        <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
          <TouchableOpacity
            style={[styles.buttonOutline, {flex: 1, marginRight: 8}]}
            onPress={onCancel}>
            <Text style={styles.buttonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buttonPrimary, {flex: 1}]}
            onPress={save}>
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ---------- hoja inferior ---------- */}
      <Modal visible={sheet.visible} transparent animationType="fade">
        {/* overlay */}
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={{flex: 1, backgroundColor: '#00000055'}} />
        </TouchableWithoutFeedback>

        {/* contenedor opciones */}
        <View
          style={{
            backgroundColor: colors.card,
            paddingBottom: 12,
            paddingTop: 8,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}>
          {sheet.options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => {
                if (sheet.field) {handle(sheet.field, opt);}
                closeSheet();
              }}
              style={{padding: 16}}>
              <Text
                style={{
                  fontSize: 18,
                  color: opt === form[sheet.field as keyof FormData] ? colors.primary : colors.foreground,
                  fontWeight: opt === form[sheet.field as keyof FormData] ? '700' : '400',
                }}>
                {opt}
              </Text>
            </Pressable>
          ))}
        </View>
      </Modal>
    </View>
  );
}
