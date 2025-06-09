// src/contexts/CatalogContext.tsx
import React, { createContext, useCallback, useEffect, useState } from 'react';
import { openDB } from '../storage/db';
import { getMaestro, MaestroItem } from '../services/api';

export type ListKey =
  | 'transaccion' | 'producto' | 'caja' | 'calibre'
  | 'subproducto' | 'origen'   | 'proceso';

export type Lists = Record<ListKey, string[]>;

const EMPTY: Lists = {
  transaccion: [], producto: [], caja: [], calibre: [],
  subproducto: [], origen: [], proceso: [],
};

export type IdLookup = Record<ListKey, Record<string, string>>;

type CatalogCtx = {
  lists   : Lists;
  loading : boolean;
  lookup  : IdLookup; 
  error   : string | null;
  refresh : () => Promise<void>;
};

const EMPTY_LOOKUP: IdLookup = {
  transaccion:{}, producto:{}, caja:{}, calibre:{},
  subproducto:{}, origen:{}, proceso:{},
};

export const CatalogContext = createContext<CatalogCtx>({
  lists: EMPTY, lookup : EMPTY_LOOKUP, loading: false, error: null, refresh: async () => {},
});

const buildEmpty = <T,>(tmpl: T): T => JSON.parse(JSON.stringify(tmpl));

export const CatalogProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [lists,   setLists]   = useState<Lists>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string|null>(null);
  const [lookup,  setLookup]  = useState<IdLookup>(EMPTY_LOOKUP)

  // Lee catálogos guardados localmente
  const loadFromDB = useCallback(async (): Promise<Lists> => {
    try {
      const db = await openDB();
      const [rs] = await db.executeSql('SELECT * FROM catalog');
      const tmpLists   = buildEmpty(EMPTY);
      const tmpLookup  = buildEmpty(EMPTY_LOOKUP);

      rs.rows.raw().forEach(r => {
        const k = r.tipo as ListKey;
        tmpLists[k].push(r.label);
        tmpLookup[k][r.label] = r.id;
      });

      setLists(tmpLists);
      setLookup(tmpLookup);
      return tmpLists;
    } catch (e) {
      __DEV__ && console.warn('[CAT] loadFromDB failed', e);
      return EMPTY;
    }
  }, []);

  // Baja catálogos de la API y actualiza el estado
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    const keys: ListKey[] = [
      'transaccion','producto','caja','calibre',
      'subproducto','origen','proceso',
    ];

    let pairs: [ListKey, MaestroItem[]][] = [];
    try {
      // 1) fetch en paralelo
      pairs = await Promise.all(
        keys.map(async k => {
          try {
            const arr = await getMaestro(k);
            return [k, arr] as [ListKey, MaestroItem[]];
          } catch {
            return [k, []] as [ListKey, MaestroItem[]];
          }
        })
      );

      // 2) actualiza UI YA con los labels
      const merged : Lists     = { ...EMPTY };
      const newLookup: IdLookup = { ...EMPTY_LOOKUP };

      pairs.forEach(([k, arr]) => {
        merged[k]    = arr.map(i => i.label);
        newLookup[k] = Object.fromEntries(
          arr.map(i => [i.label, i.id]),
        );
      });

      setLists(merged);
      setLookup(newLookup);

    } catch (err: any) {
      __DEV__ && console.warn('[CAT] fetch error', err);
      setError('No se pudieron descargar los catálogos');
    } finally {
      // 3) quita spinner inmediatamente, ya tienes datos para el formulario
      setLoading(false);
    }

    // 4) persiste en SQLite *sin* bloquear el spinner ni el form
    (async () => {
      try {
        const db = await openDB();
        await db.executeSql('DELETE FROM catalog');
        for (const [tipo, items] of pairs) {
          for (const it of items) {
            await db.executeSql(
              'INSERT OR IGNORE INTO catalog(tipo,id,label) VALUES (?,?,?)',
              [tipo, it.id, it.label],
            );
          }
        }
      } catch (e) {
        __DEV__ && console.warn('[CAT] persist error', e);
      }
    })();

  }, []);

  // Al iniciar, carga de local y solo si está vacío llama a refresh()
  useEffect(() => {
    (async () => {
      const local = await loadFromDB();
      setLists(local);
      const allFilled = Object.values(local).every(arr => arr.length > 0);
      if (!allFilled) {
        await refresh();
      }
    })();
  }, [loadFromDB, refresh]);

  return (
    <CatalogContext.Provider value={{ lists, loading, error, lookup, refresh }}>
      {children}
    </CatalogContext.Provider>
  );
};
