import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

/* Abre (o crea) la base local
   ─ Android →  /data/data/<app-id>/databases/weights.db
   ─ iOS     →  ~/Library/LocalDatabase/weights.db
*/

let dbInstance: SQLiteDatabase | null = null;

export const openDB = async () => {
  if (dbInstance) return dbInstance;            // reutiliza
  dbInstance = await SQLite.openDatabase({ name: 'weights.db', location: 'default' });
  return dbInstance;
};

export const closeDB = async () => {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
  }
};

/* Ejecuta **una** vez (p. ej. en `App.tsx`) */
export const initDB = async () => {
  console.log('[DB] initDB ▶');
  const db = await openDB();

  await db.executeSql('PRAGMA journal_mode=WAL;');
  await db.executeSql('PRAGMA busy_timeout=5000;');

  /* Tabla de lecturas */
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS weights (
      id           TEXT PRIMARY KEY,
      weight       REAL,
      unit         TEXT,
      quantity     INTEGER,
      folio        TEXT,
      "transaction"  TEXT,
      product      TEXT,
      subproduct   TEXT,
      box          TEXT,
      caliber      TEXT,
      origin       TEXT,
      "process"      TEXT,
      notes        TEXT,
      timestamp    TEXT,
      transactionId TEXT,
      productId     TEXT,
      subproductId  TEXT,
      boxId         TEXT,
      caliberId     TEXT,
      originId      TEXT,
      processId     TEXT,
      synced       INTEGER DEFAULT 0
    );
  `);

  /* ☆ Tabla genérica de catálogos */
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS catalog (
      tipo  TEXT,
      id    TEXT,
      label TEXT,
      PRIMARY KEY (tipo,id)
    );
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS queue (
      id         TEXT PRIMARY KEY,
      form_type  INTEGER,     -- 1 = peso, 2 = otro formulario, etc
      payload    TEXT,        -- JSON string listo para enviar
      timestamp  TEXT
    );
  `);

  console.log('[DB] initDB ✔ tablas OK, cerrado');
};
