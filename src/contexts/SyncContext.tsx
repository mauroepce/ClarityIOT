import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import { initDB, openDB } from '../storage/db';
import { postPeso } from '../services/api';
import { WeightRecord } from '../types';

const TIMEOUT = 10_000;

/* ---------- contexto ---------- */
type Ctx = {
  pending:   WeightRecord[];
  synced:    WeightRecord[];
  isSyncing: boolean;
  isOnline:  boolean;
  busy:      boolean;
  addRecord: (r: Omit<WeightRecord, 'id' | 'synced'>) => Promise<void>;
  syncAllNow: () => Promise<void>;
  clearSynced: () => Promise<void>;
};
export const SyncContext = createContext<Ctx>({} as Ctx);

/* ----------------------------------------------------------------------------
 * PROVIDER
 * ------------------------------------------------------------------------- */
export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  /* ---------- flags de estado ---------- */
  const [dbReady, setDbReady]     = useState(false);          // 🔸
  const [pending, setPending]     = useState<WeightRecord[]>([]);
  const [synced,  setSynced]      = useState<WeightRecord[]>([]);
  const [isSyncingRaw, _setIsSyncing] = useState(false);
  const isSyncingRef = useRef(false);
  const [isOnline, setIsOnline]   = useState(false);
  const [busy,     setBusy]       = useState(false);

  const setIsSyncing = (v: boolean) => {
    isSyncingRef.current = v;
    _setIsSyncing(v);
  };

  /* ────────────── helpers ────────────── */
  const reloadLists = useCallback(async () => {
    if (!dbReady) {return;}
    console.log('[SYNC] ▶ reloadLists — arrancando');
    try {
      const db = await openDB();

      const [p] = await db.executeSql(
        'SELECT * FROM weights WHERE synced=0 ORDER BY timestamp DESC',
      );
      const [s] = await db.executeSql(
        'SELECT * FROM weights WHERE synced=1 ORDER BY timestamp DESC',
      );

      const toBool = (r: any) =>
        ({ ...r, synced: !!r.synced }) as WeightRecord;

      setPending(p.rows.raw().map(toBool));
      setSynced(s.rows.raw().map(toBool));

      console.log('[SYNC] ✔ reloadLists — terminado');
    } catch (e) {
      console.warn('[SYNC] reloadLists failed', e);
      setPending([]);
      setSynced([]);
    }
  }, [dbReady]);

  const uploadOne = useCallback(
    async (r: WeightRecord) => {
      const ctrl = new AbortController();
      const toId = setTimeout(() => ctrl.abort(), TIMEOUT);
      console.log('[SYNC] ▶ uploadOne – id=', r.id);

      try {
        const srv = await postPeso(r);
        console.log('[SYNC] 👍', srv.info);

        const db = await openDB();
        await db.executeSql('UPDATE weights SET synced=1 WHERE id=?', [r.id]);
        console.log('[SYNC] ✔ marcado synced=1');
      } catch (err) {
        console.warn('[SYNC] 👎 uploadOne error', err);
        throw err;
      } finally {
        clearTimeout(toId);
      }
    },
    [],
  );

  const syncAllNow = useCallback(
    async () => {
      if (!dbReady) {return;}

      if (!isOnline || isSyncingRef.current) {
        return;
      }

      setIsSyncing(true);
      try {
        const db = await openDB();
        const [p] = await db.executeSql('SELECT * FROM weights WHERE synced=0');
        const list = p.rows.raw().map(r => ({ ...r, synced: false }));

        console.log('[SYNC] 📋 pendientes =', list.length);

        if (list.length) {
          for (const row of list) {
            try {
              await uploadOne(row);
            } catch (err) {
              console.error('[SYNC] ⚠️ uploadOne inside syncAllNow – error', err);
            }
          }
          await reloadLists();
        } else {
          console.log('[SYNC] ✔ nothing to sync');
        }
      } catch (err) {
        console.error('[SYNC] ⚠️ syncAllNow – error', err);
      } finally {
        setIsSyncing(false);
      }
    },
    [dbReady, isOnline, reloadLists, uploadOne],
  );

  /* ────────────── init BD ────────────── */
  useEffect(() => {
    (async () => {
      console.log('[SYNC] init ▶ arrancando initDB');
      try {
        await initDB();
        setDbReady(true);
      } catch (err) {
        console.error('[SYNC] ❌ initDB', err);
      }
    })();
  }, []);

  useEffect(() => {
    if (!dbReady) {return;}
    (async () => {
      await reloadLists();        // ← lee de SQLite
      if (isOnline) {await syncAllNow();}  // ← ahora sí toca la red
    })();
  }, [dbReady, isOnline, reloadLists, syncAllNow]);

  /* ────────────── listener de red ────────────── */
  useEffect(() => {
    if (!dbReady) {return;}
    const unsub = NetInfo.addEventListener(s => {
      setIsOnline(!!s.isConnected);
    });
    return unsub;
  }, [dbReady]);

  /* ────────────── addRecord ────────────── */
  const addRecord: Ctx['addRecord'] = async data => {
    if (!dbReady) {return;}
    setBusy(true);
    try {
      const id = Date.now().toString();
      const db = await openDB();
      await db.executeSql(
        `INSERT INTO weights
          (id,weight,unit,quantity,folio,"transaction",product,subproduct,
            box,caliber,origin,"process",notes,timestamp,
            transactionId, productId, subproductId, boxId,
            caliberId, originId, processId)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id,
          data.weight,
          data.unit,
          data.quantity,
          data.folio,
          data.transaction,
          data.product,
          data.subproduct ?? '',
          data.box,
          data.caliber,
          data.origin ?? '',
          data.process ?? '',
          data.notes ?? '',
          data.timestamp,
          data.transactionId,
          data.productId,
          data.subproductId,
          data.boxId,
          data.caliberId,
          data.originId,
          data.processId,
        ],
      );

      if (!isOnline) {
        await reloadLists();
      } else {
        await syncAllNow();
      }
    } catch (err) {
      console.error('[SYNC] ❌ addRecord failed', err);
    } finally {
      setBusy(false);
    }
  };

  /* ────────────── clearSynced ────────────── */
  const clearSynced = useCallback(async () => {
    if (!dbReady) {return;}                    // 🔸
    const db = await openDB();
    await db.executeSql('DELETE FROM weights WHERE synced=1');
    db.close();
    await reloadLists();
  }, [dbReady, reloadLists]);

  /* ────────────── exporta contexto ────────────── */
  return (
    <SyncContext.Provider
      value={{
        pending,
        synced,
        isSyncing: isSyncingRaw,
        isOnline,
        busy,
        addRecord,
        syncAllNow,
        clearSynced,
      }}>
      {children}
    </SyncContext.Provider>
  );
};
