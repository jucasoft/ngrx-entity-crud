/*
 * Selezione delle righe nei dialog form-clipboard, gestita dal componente anziché dalla
 * `p-table`: `p-tableCheckbox`/`p-tableHeaderCheckbox` hanno selettori camelCase fino a
 * PrimeNG 21 e kebab in v22 (il matching distingue le maiuscole), quindi non esiste una
 * grafia che funzioni compilando con v22 e girando su v16. Il risultato segue sempre
 * l'ordine di `all`, così il JSON generato non dipende dall'ordine dei click.
 */

/** Seleziona o deseleziona `item`. */
export function necToggleItem<T>(
  all: readonly T[],
  selection: readonly T[],
  item: T
): T[] {
  const selected = selection.includes(item);
  return all.filter((x) => (x === item ? !selected : selection.includes(x)));
}

/** Tutte le righe selezionate → nessuna; altrimenti tutte. */
export function necToggleAll<T>(
  all: readonly T[],
  selection: readonly T[]
): T[] {
  return necAllSelected(all, selection) ? [] : [...all];
}

/** `true` se c'è almeno una riga e sono tutte selezionate. */
export function necAllSelected<T>(
  all: readonly T[],
  selection: readonly T[]
): boolean {
  return all.length > 0 && all.every((x) => selection.includes(x));
}
