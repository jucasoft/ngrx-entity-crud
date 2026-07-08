/**
 * Table report schematics
 */
declare interface TableReport {
  /**
   * Percorso del file di report da generare (relativo alla root del workspace).
   * Se omesso: `table-report.<format>`. Stringa vuota = solo console.
   */
  output?: string;
  /**
   * Formato del report scritto su file.
   */
  format?: 'md' | 'json';
  /**
   * Includi il dettaglio per-colonna estratto via AST (field, headerName,
   * altre proprieta'). Default: true.
   */
  columns?: boolean;
  /**
   * Includi anche le tabelle PrimeNG p-table (quelle generate dallo schematic
   * section). Default: true.
   */
  pTable?: boolean;
}
