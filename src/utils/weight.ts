/** Tipo de unidad manejada internamente */
export type Unit = 'kg' | 't' | 'lb' | 'oz';

/** Etiqueta de la unidad para UI */
export const UNIT_LABEL: Record<Unit, string> = {
  kg: 'Kilogramo',
  t:  'Tonelada',
  lb: 'Libras',
  oz: 'Onzas',
};

/** Convierte un valor en kilogramos a la unidad destino */
export function convert(valueKg: number, to: Unit): number {
  switch (to) {
    case 't':  return valueKg / 1_000;
    case 'lb': return valueKg * 2.20462262185;
    case 'oz': return valueKg * 35.27396195;
    default:   return valueKg;            // kg
  }
}

/** Devuelve string formateado con 2 decimales y etiqueta legible */
export function convertWeight(valueKg: number, to: Unit): string {
  return `${convert(valueKg, to).toFixed(2)} ${UNIT_LABEL[to]}`;
}
