export type Unit = 'kg' | 't' | 'lb' | 'oz';
export const UNITS: Unit[] = ['kg', 't', 'lb', 'oz'];

/* Mapeo a nombre largo – solo cuando sea necesario en UI (ej.: Picker) */
export const UNIT_LABEL: Record<Unit, string> = {
  kg: 'Kilogramo',
  t:  'Tonelada',
  lb: 'Libras',
  oz: 'Onzas',
};

/* Devuelve SOLO el número formateado (sin nombre / sin abreviatura) */
export function convertWeight(valueKg: number, to: Unit): string {
  const v =
    to === 'kg' ? valueKg :
    to === 't'  ? valueKg / 1_000 :
    to === 'lb' ? valueKg * 2.20462262 :
                  valueKg * 35.2739619;

  return v.toFixed(2);
}
