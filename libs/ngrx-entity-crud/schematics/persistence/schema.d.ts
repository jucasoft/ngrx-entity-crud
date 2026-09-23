declare interface CrudPersistence {
  /**
   * Nome dell'entita' della sezione (es. Coin).
   */
  clazz: string;

  /**
   * Attiva subito la persistenza (`enabled: true` in `<clazz>.persistence.ts`).
   * Default `false`: cablaggio presente ma spento.
   */
  enabled?: boolean;

  /**
   * Collega anche la UI della sezione (`<nec-restore-search>` attorno ad `<app-search>`). Default `true`.
   */
  ui?: boolean;

  /**
   * The name of the project.
   */
  project?: string;
}
