import SQLite from 'react-native-sqlite-storage';
SQLite.enablePromise(true);

export async function openDB() {
  return SQLite.openDatabase({ name: 'weights.db', location: 'default' });
}

export async function initDB() {
  const db = await openDB();
  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS weights (
      id          TEXT PRIMARY KEY,
      weight      REAL,
      unit        TEXT,
      quantity    INTEGER,
      folio       TEXT,
      transaction TEXT,
      product     TEXT,
      container   TEXT,
      caliber     TEXT,
      notes       TEXT,
      timestamp   TEXT,
      synced      INTEGER DEFAULT 0
    )
  `);
}
