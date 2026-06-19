/**
 * Dashboard schematics
 */
declare interface Dashboard {
  /**
   * Nome della feature dashboard (default: Dashboard).
   */
  clazz?: string;
  /**
   * The name of the project.
   */
  project?: string;
  /**
   * Genera anche il lazy-report JSON letto dalla dashboard. Default: true.
   */
  includeLazyReport?: boolean;
  /**
   * Percorso del lazy-report JSON generato (se includeLazyReport=true).
   */
  lazyReportOutput?: string;
}
