import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { useTheme }       from '../../contexts/ThemeContext';
import { Unit }           from '../../utils/weight';
import { CatalogContext, ListKey } from '../../contexts/CatalogContext';

/* ---------- tipo ---------- */
export type FormData = {
  quantity   : number;
  folio      : string;
  transaction: string;
  product    : string;
  subproduct : string;
  box        : string;
  caliber    : string;
  origin     : string;
  process    : string;
  notes?     : string;
  timestamp  : string;
  unit       : Unit;
};

type Props = {
  onSubmit: (d: FormData) => void;
  onCancel: () => void;
};

/* ---------- componente ---------- */
export default function WeightForm({ onSubmit, onCancel }: Props) {
  const { styles, colors }            = useTheme();
  const { lists, loading, error, lookup, refresh } = useContext(CatalogContext);
  /* -------------------------------- estado -------------------------------- */
  const [form, setForm] = useState<FormData>({
    quantity   : 0,
    folio      : '',
    transaction: '',
    product    : '',
    subproduct : '',
    box        : '',
    caliber    : '',
    origin     : '',
    process    : '',
    notes      : '',
    timestamp  : new Date().toISOString(),
    unit       : 'kg',
  });

  /** Errores por campo – se pintan debajo del input */
  const [errs, setErrs] = useState<Partial<Record<keyof FormData, string>>>({});

  /** para hacer scroll al primer error  */
  const scrollRef = useRef<ScrollView>(null);

  /* defaults cuando ya vinieron los catálogos */
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      transaction: prev.transaction || lists.transaccion[0] || '',
      product    : prev.product     || lists.producto[0]    || '',
      subproduct : prev.subproduct  || lists.subproducto[0] || '',
      box        : prev.box         || lists.caja[0]        || '',
      caliber    : prev.caliber     || lists.calibre[0]     || '',
      origin     : prev.origin      || lists.origen[0]      || '',
      process    : prev.process     || lists.proceso[0]     || '',
    }));
  }, [lists]);

  /* -------------------------------- helpers -------------------------------- */
  const handle = (k: keyof FormData, v: any) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrs(e => ({ ...e, [k]: undefined })); // limpia error al cambiar
  };

  /* ---------- validación antes de enviar ---------- */
  const validate = () => {
    const newErrs: typeof errs = {};

    if (!form.folio.trim()) newErrs.folio = 'Este campo es obligatorio';
    if (form.quantity <= 0) newErrs.quantity = 'Debes indicar un valor mayor a 0';

    ([
      'transaction',
      'product',
      'subproduct',
      'box',
      'caliber',
      'origin',
      'process',
    ] as (keyof FormData)[]).forEach(k => {
      if (!form[k]) newErrs[k] = 'Este campo es obligatorio';
    });

    setErrs(newErrs);
    return Object.keys(newErrs).length === 0;
  };

  const save = () => {
    if (!validate()) {
      // lleva al primer error
      const first = Object.keys(errs)[0] as keyof FormData;
      if (first && scrollRef.current) {
        scrollRef.current.scrollTo({ y: 0, animated: true });
      }
      return;
    }
    const toId = (k: ListKey, lbl: string) => lookup[k][lbl] ?? lbl;

    const record = {
      ...form,
      transactionId : toId('transaccion', form.transaction),
      productId     : toId('producto',    form.product),
      subproductId  : toId('subproducto', form.subproduct),
      boxId         : toId('caja',        form.box),
      caliberId     : toId('calibre',     form.caliber),
      originId      : toId('origen',      form.origin),
      processId     : toId('proceso',     form.process),
    };

    onSubmit(record as any); 

  };

  /* ---------- selector modal bottom sheet ---------- */
  const [sheet, setSheet] = useState<{
    visible: boolean;
    field  : keyof FormData | null;
    options: string[];
  }>({ visible: false, field: null, options: [] });

  const openSheet  = (f: keyof FormData, o: string[]) =>
    setSheet({ visible: true, field: f, options: o });
  const closeSheet = () =>
    setSheet({ visible: false, field: null, options: [] });

  /* ---------- fecha / hora ---------- */
  const openDateTimePicker = () => {
    DateTimePickerAndroid.open({
      value: new Date(form.timestamp),
      mode : 'date',
      onChange: (_, d) => {
        if (!d) return;
        DateTimePickerAndroid.open({
          value   : d,
          mode    : 'time',
          is24Hour: true,
          onChange: (_, t) => {
            if (t) handle('timestamp', t.toISOString());
          },
        });
      },
    });
  };

  /* ---------- Selector reutilizable ---------- */
  const Selector = ({
    label,
    field,
    options,
  }: {
    label  : string;
    field  : keyof FormData;
    options: string[];
  }) => (
    <>
      <Text style={styles.inputLabel}>
        {label}
        {' *'}
      </Text>

      <TouchableOpacity
        disabled={options.length === 0}
        onPress={() => openSheet(field, options)}
        style={{
          borderWidth : 1,
          borderColor : errs[field] ? colors.destructive : colors.border,
          borderRadius: 8,
          padding     : 12,
          marginBottom: 4,
        }}>
        <Text style={{ color: colors.foreground }}>
          {form[field] || (options.length ? '—' : 'Sin datos')}
        </Text>
      </TouchableOpacity>

      {errs[field] && (
        <Text style={{ color: colors.destructive, marginBottom: 12 }}>
          {errs[field]}
        </Text>
      )}
    </>
  );

  /* ---------- estados de carga / error ---------- */
  if (loading) {
    return (
      <View style={[styles.card, { padding: 32, alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16 }}>Cargando catálogos…</Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={[styles.card, { padding: 32 }]}>
        <Text style={{ color: colors.destructive }}>{error}</Text>
        <TouchableOpacity
          style={[styles.buttonOutline, { marginTop: 16 }]}
          onPress={refresh}>
          <Text style={styles.buttonTextSecondary}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------- UI principal ---------- */
  return (
    <View style={[styles.card, { padding: 0 }]}>
      {/* header */}
      <View
        style={{
          flexDirection   : 'row',
          justifyContent  : 'space-between',
          alignItems      : 'center',
          padding         : 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}>
        <Text style={styles.cardTitle}>Registrar Peso</Text>
        <TouchableOpacity onPress={onCancel}>
          <MaterialIcons name="close" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled">

        {/* Folio */}
        <Text style={styles.inputLabel}>Folio *</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: errs.folio ? colors.destructive : colors.border },
          ]}
          value={form.folio}
          onChangeText={t => handle('folio', t)}
        />
        {errs.folio && (
          <Text style={{ color: colors.destructive, marginBottom: 12 }}>
            {errs.folio}
          </Text>
        )}

        {/* Cantidad */}
        <Text style={styles.inputLabel}>Cantidad *</Text>
        <TextInput
          style={[
            styles.input,
            { borderColor: errs.quantity ? colors.destructive : colors.border },
          ]}
          keyboardType="numeric"
          value={String(form.quantity || '')}
          onChangeText={t => handle('quantity', parseInt(t) || 0)}
        />
        {errs.quantity && (
          <Text style={{ color: colors.destructive, marginBottom: 12 }}>
            {errs.quantity}
          </Text>
        )}

        {/* Selectores obligatorios */}
        <Selector label="Transacción"   field="transaction" options={lists.transaccion} />
        <Selector label="Producto"      field="product"     options={lists.producto}    />
        <Selector label="Sub-Producto"  field="subproduct"  options={lists.subproducto} />
        <Selector label="Caja"          field="box"         options={lists.caja}        />
        <Selector label="Calibre"       field="caliber"     options={lists.calibre}     />
        <Selector label="Origen"        field="origin"      options={lists.origen}      />
        <Selector label="Proceso"       field="process"     options={lists.proceso}     />

        {/* Notas */}
        <Text style={styles.inputLabel}>Notas</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          multiline
          value={form.notes}
          onChangeText={t => handle('notes', t)}
        />

        {/* Fecha & hora */}
        <Text style={styles.inputLabel}>Fecha y Hora</Text>
        <TouchableOpacity
          style={{
            borderWidth : 1,
            borderColor : colors.border,
            borderRadius: 8,
            padding     : 12,
            marginBottom: 16,
          }}
          onPress={openDateTimePicker}>
          <Text>{new Date(form.timestamp).toLocaleString()}</Text>
        </TouchableOpacity>

        {/* botones */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity
            style={[styles.buttonOutline, { flex: 1, marginRight: 8 }]}
            onPress={onCancel}>
            <Text style={styles.buttonTextSecondary}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonPrimary, { flex: 1 }]}
            onPress={save}>
            <Text style={styles.buttonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom-sheet de opciones */}
      <Modal visible={sheet.visible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={{ flex: 1, backgroundColor: '#00000055' }} />
        </TouchableWithoutFeedback>

        <View
          style={{
            backgroundColor : colors.card,
            paddingBottom   : 12,
            paddingTop      : 8,
            borderTopLeftRadius : 16,
            borderTopRightRadius: 16,
          }}>
          {sheet.options.map(opt => (
            <Pressable
              key={opt}
              onPress={() => {
                if (sheet.field) handle(sheet.field, opt);
                closeSheet();
              }}
              style={{ padding: 16 }}>
              <Text
                style={{
                  fontSize : 18,
                  color    : opt === form[sheet.field as keyof FormData]
                    ? colors.primary
                    : colors.foreground,
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
