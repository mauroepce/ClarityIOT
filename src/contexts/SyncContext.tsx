import React, { createContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import axios from 'axios';
import { openDB, initDB } from '../storage/db';

export type WeightRecord = {
  id: string;
  weight: number;
  unit: string;
  quantity: number;
  folio: string;
  transaction: string;
  product: string;
  container: string;
  caliber: string;
  notes?: string;
  timestamp: string;
  synced: boolean;
};

type SyncCtx = {
  pending: WeightRecord[];
  synced: WeightRecord[];
  isSyncing: boolean;
  isOnline: boolean;
  addRecord: (r: Omit<WeightRecord, 'id' | 'synced'>) => Promise<void>;
  syncAll: () => Promise<void>;
  clearSynced: () => Promise<void>;
};

export const SyncContext = createContext<SyncCtx>({} as SyncCtx);

const API_URL = 'https://api.example.com/weights';

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pending, setPending] = useState<WeightRecord[]>([]);
  const [synced, setSynced]   = useState<WeightRecord[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline]   = useState(false);

  /** Cargar DB al arrancar */
  useEffect(() => {
    (async () => {
      await initDB();
      await reloadLists();
    })();
  }, []);

  /** Escuchar conectividad */
  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => setIsOnline(s.isConnected ?? false));
    return unsub;
  }, []);

  /** ---- helpers ---- */
  const reloadLists = async () => {
    const db = await openDB();
    const [pRows] = await db.executeSql('SELECT * FROM weights WHERE synced=0 ORDER BY timestamp DESC');
    const [sRows] = await db.executeSql('SELECT * FROM weights WHERE synced=1 ORDER BY timestamp DESC');
    setPending(pRows.rows.raw());
    setSynced(sRows.rows.raw());
  };

  /** addRecord */
  const addRecord: SyncCtx['addRecord'] = async data => {
    const db = await openDB();
    const id = Date.now().toString();
    await db.executeSql(
      `INSERT INTO weights
       (id,weight,unit,quantity,folio,transaction,product,container,caliber,notes,timestamp,synced)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,0)`,
      [id, data.weight, data.unit, data.quantity, data.folio, data.transaction,
       data.product, data.container, data.caliber, data.notes ?? '', data.timestamp]
    );
    await reloadLists();
    if (isOnline) await syncAll();
  };

  /** syncSingle */
  const syncSingle = async (rec: WeightRecord) => {
    await axios.post(API_URL, { ...rec, synced: undefined });
    const db = await openDB();
    await db.executeSql('UPDATE weights SET synced=1 WHERE id=?', [rec.id]);
  };

  /** syncAll */
  const syncAll = async () => {
    if (!isOnline || pending.length === 0) return;
    setIsSyncing(true);
    for (const r of pending) {
      try { await syncSingle(r); } catch (e) { console.warn(e); }
    }
    await reloadLists();
    setIsSyncing(false);
  };

  /** clearSynced */
  const clearSynced = async () => {
    const db = await openDB();
    await db.executeSql('DELETE FROM weights WHERE synced=1');
    await reloadLists();
  };

  return (
    <SyncContext.Provider value={{ pending, synced, isSyncing, isOnline, addRecord, syncAll, clearSynced }}>
      {children}
    </SyncContext.Provider>
  );
};
