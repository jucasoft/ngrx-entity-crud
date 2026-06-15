/**
 * Lazy store report schematics
 */
declare interface LazyReport {
  /**
   * Percorso del file di report da generare (relativo alla root del workspace).
   * Stringa vuota = solo console.
   */
  output?: string;
  /**
   * Formato del report scritto su file.
   */
  format?: 'md' | 'json';
  /**
   * Store infrastrutturali da escludere dai candidati lazy (nome cartella).
   */
  infraStores?: string[];
}
