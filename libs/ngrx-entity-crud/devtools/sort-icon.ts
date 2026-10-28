/** Classi primeicons dell'icona di ordinamento di una colonna `pSortableColumn`. */
export type NecSortIconClass =
  | 'pi-sort-alt'
  | 'pi-sort-amount-up-alt'
  | 'pi-sort-amount-down';

/**
 * Icona di ordinamento di una colonna, letta dallo stato della `p-table` (sort singolo).
 *
 * Sostituisce `<p-sortIcon>`: il suo selettore è `p-sortIcon` fino a PrimeNG 21 e
 * `p-sort-icon`/`p-sorticon` da PrimeNG 22, e il matching dei selettori distingue le
 * maiuscole, quindi nessuna grafia funziona compilando con v22 e girando su v16. `sortField`
 * e `sortOrder` sono invece proprietà pubbliche della `Table` in tutte le major (getter in
 * v16, campi in v22). Stessa logica del `SortIcon` di PrimeNG 16.
 */
export function necSortIconClass(
  table: { sortField?: string | null; sortOrder?: number },
  field: string
): NecSortIconClass {
  if (table.sortField !== field) {
    return 'pi-sort-alt';
  }
  if (table.sortOrder === 1) {
    return 'pi-sort-amount-up-alt';
  }
  return table.sortOrder === -1 ? 'pi-sort-amount-down' : 'pi-sort-alt';
}
