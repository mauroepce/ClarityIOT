import axios from 'axios';
import { API_BASE, API_TOKEN, API_ORG, API_CCOST, ID_MODULE } from '@env';
import { WeightRecord } from '../types';
import dayjs from 'dayjs';
import utc   from 'dayjs/plugin/utc';
import tz    from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(tz);

/* instancia axios 10 s */
export const api = axios.create({ baseURL: API_BASE, timeout: 10_000 });

/* ───── MAESTROS ───── */
export type Maestro =
  | 'transaccion' | 'producto' | 'caja' | 'calibre'
  | 'subproducto' | 'origen'   | 'proceso';

export type MaestroItem = { label:string; id:string };

export async function getMaestro(tipo: Maestro): Promise<MaestroItem[]> {
  const ctrl  = new AbortController();
  const toId  = setTimeout(()=>ctrl.abort(), 10_000);

  try {
    const { data } = await api.post(
      '', { wsname:'getmaestro', token:API_TOKEN, tipo,
            idorganizacion:API_ORG, idcentrocosto:API_CCOST },
      { signal: ctrl.signal },
    );

    if (!data?.info?.tipo) {return [];}

    return data.info.tipo.map((t:any)=>{
      const idKey = Object.keys(t).find(k=>k.startsWith('id'))!;
      return { label:t.descripcion, id:t[idKey] };
    });
  } finally { clearTimeout(toId); }
}

/* ───── ENVÍO PESO ───── */
export async function postPeso(
  r: WeightRecord,
): Promise<{ success: true; info: string }> {
  const ts = dayjs(r.timestamp)
    .tz('America/Santiago')
    .format('YYYY-MM-DD HH:mm:ss');

  const payload = {
    wsname: 'insert_record_pesa',
    token: API_TOKEN,
    idmodulo: ID_MODULE,
    fecha: [ts, ts],
    cantidad: r.quantity,
    peso: r.weight,
    tipo: {
      transaccion: r.transactionId,
      producto: r.productId,
      subproducto: r.subproductId,
      caja: r.boxId,
      calibre: r.caliberId,
      origen: r.originId,
      proceso: r.processId,
    },
    folio: r.folio,
    nota: r.notes ?? '',
    idorganizacion: API_ORG,
    idcentrocosto: API_CCOST,
  };

  __DEV__ && console.log('📤 payload', payload);

  const { data } = await api.post('', payload);
  __DEV__ && console.log('🟢 respuesta', data);

  if (!data?.success) {
    throw new Error(data?.info ?? 'Error desconocido en servicio');
  }

  return data;
}
