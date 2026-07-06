export const NEC_FORM_CLIPBOARD_VERSION = 1;

/**
 * Envelope condiviso tra utenti (chat/email): JSON leggibile, ispezionabile
 * prima dell'incolla. `componentName` identifica il form di origine e blocca
 * l'incolla su un form diverso.
 */
export interface NecFormClipboardPayload {
  v: number;
  componentName: string;
  formData: Record<string, unknown>;
}

/**
 * Riga della tabella di riepilogo: una per campo (foglia) del form value.
 */
export interface NecFormClipboardField {
  /** percorso della foglia, es. 'conditionMap.test.conditions.startDate' */
  path: string;
  label: string;
  value: unknown;
  summary: string;
  /** solo in import: sintesi del valore attuale del form, per confronto */
  currentSummary?: string;
}

export interface NecFormClipboardParseResult {
  payload?: NecFormClipboardPayload;
  error?: string;
}
