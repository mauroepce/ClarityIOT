declare module 'react-native-sqlite-storage' {
    export interface ResultSet {
      rowsAffected: number;
      insertId?: number;
      rows: {
        length: number;
        item(index: number): any;
        raw(): any[];
      };
    }

    export interface SQLiteDatabase {
      executeSql(query: string, params?: any[]): Promise<[ResultSet]>;
      close(): Promise<void>;
    }

    export interface OpenParams {
      name: string;
      location?: string;          // 'default' | 'Library' | 'Documents'
      createFromLocation?: string | number;
    }

    interface SQLiteStatic {
      enablePromise(enable: boolean): void;
      openDatabase(params: OpenParams): Promise<SQLiteDatabase>;
    }

    const SQLite: SQLiteStatic;
    export default SQLite;
  }
