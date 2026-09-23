import {createSelector} from '@ngrx/store';

/**
 * Selettori "agnostici" di loading/error.
 *
 * Scandiscono lo stato root sfruttando la convenzione di `ngrx-entity-crud`: ogni slice
 * CRUD espone `isLoading: boolean` ed `error: string | null` al livello top.
 *
 * Sono indipendenti dai domini (nessun import dei singoli `XxxStoreSelectors`): questo
 * permette anche agli store registrati in modo lazy nel feature module di contribuire
 * al loading/errore globale, senza accoppiare il root ai domini ne' rompere a runtime
 * quando una slice non e' ancora caricata.
 */

/**
 * Chiavi di slice da ESCLUDERE dallo scan (slice che non seguono la convenzione
 * `EntityCrudBaseState`, oppure CRUD che non devono contribuire al loading globale).
 */
const BLACKLIST: ReadonlyArray<string> = [];

/**
 * Se valorizzata, vengono considerate SOLO queste chiavi (ha precedenza sulla BLACKLIST).
 */
const WHITELIST: ReadonlyArray<string> = [];

interface LoadingSlice {
  isLoading?: boolean;
  error?: unknown;
}

const selectRootState = (state: any): Record<string, any> => state;

const isEligible = (key: string): boolean =>
  WHITELIST.length > 0 ? WHITELIST.includes(key) : !BLACKLIST.includes(key);

const isLoadingSlice = (value: any): value is LoadingSlice =>
  !!value && typeof value === 'object' && typeof value.isLoading === 'boolean';

const crudEntries = (state: Record<string, any>): Array<[string, LoadingSlice]> =>
  Object.entries(state)
    .filter(([key]) => isEligible(key))
    .filter((entry): entry is [string, LoadingSlice] => isLoadingSlice(entry[1]));

/**
 * Nomi delle slice attualmente in caricamento (`isLoading === true`).
 */
export const selectLoadingNames = createSelector(
  selectRootState,
  (state): string[] =>
    crudEntries(state)
      .filter(([, slice]) => slice.isLoading === true)
      .map(([key]) => key)
);

/**
 * `true` se almeno una slice CRUD e' in caricamento.
 */
export const selectIsLoading = createSelector(
  selectLoadingNames,
  (names): boolean => names.length > 0
);

/**
 * Gli effect di ngrx-entity-crud, nel catchError, salvano in `error` l'oggetto intercettato
 * (es. HttpErrorResponse) e non una stringa: va ridotto a testo, altrimenti sparirebbe dal banner.
 */
const errorToText = (error: unknown): string => {
  if (error === null || error === undefined) {
    return '';
  }
  if (typeof error === 'string') {
    return error;
  }
  const message = (error as { message?: unknown }).message;
  if (typeof message === 'string' && message.length > 0) {
    return message;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
};

/**
 * Elenco degli errori non vuoti presenti nelle slice CRUD.
 */
export const selectErrors = createSelector(
  selectRootState,
  (state): string[] =>
    crudEntries(state)
      .map(([, slice]) => errorToText(slice.error))
      .filter((error) => error.length > 0)
);

/**
 * Concatenazione degli errori non vuoti (stringa vuota se non ce ne sono).
 */
export const selectError = createSelector(
  selectErrors,
  (errors): string => errors.join('\n')
);
