/**
 * Gets the type of the key
 * @param value - The value of the key
 * @returns The type of the key
 */
export declare function getKeyType(value: any): "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB";
/**
 * Maps the PostgreSQL type to the SQLite type
 * @param data_type - The PostgreSQL type
 * @returns The SQLite type
 */
export declare function mapPgTypeToSQLite(data_type: string): string;
//# sourceMappingURL=getKeyType.d.ts.map