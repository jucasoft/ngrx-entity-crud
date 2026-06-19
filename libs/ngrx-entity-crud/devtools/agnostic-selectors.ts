import {createSelector, MemoizedSelector} from '@ngrx/store';

/**
 * Versione FACTORY (parametrizzabile) dei selettori agnostici di loading/error che il
 * template `ng-add` installa in `root-store/selectors.ts`.
 *
 * Il template resta invariato (retro-compatibilità): qui la logica è IDENTICA ma con
 * `rootSelector`/`blacklist`/`whitelist` resi parametri invece che costanti hardcoded, così
 * è riutilizzabile dal pacchetto npm (entry-point `ngrx-entity-crud/devtools`).
 *
 * Scandisce lo stato sfruttando la convenzione `EntityCrudBaseState`: ogni slice CRUD espone
 * `isLoading: boolean` ed `error: string | null` al livello top.
 */
export interface AgnosticLoadingSelectorsOptions {
  /** Selettore della radice da scandire (default: l'intero stato root). */
  rootSelector?: (state: any) => Record<string, any>;
  /** Chiavi di slice da escludere dallo scan. */
  blacklist?: ReadonlyArray<string>;
  /** Se valorizzata, considera SOLO queste chiavi (precede la blacklist). */
  whitelist?: ReadonlyArray<string>;
}

export interface AgnosticLoadingSelectors {
  /** Nomi delle slice attualmente in caricamento (`isLoading === true`). */
  selectLoadingNames: MemoizedSelector<any, string[]>;
  /** `true` se almeno una slice CRUD è in caricamento. */
  selectIsLoading: MemoizedSelector<any, boolean>;
  /** Elenco degli errori non vuoti presenti nelle slice CRUD. */
  selectErrors: MemoizedSelector<any, string[]>;
  /** Concatenazione degli errori non vuoti (stringa vuota se non ce ne sono). */
  selectError: MemoizedSelector<any, string>;
}

interface LoadingSlice {
  isLoading?: boolean;
  error?: string | null;
}

export function createAgnosticLoadingSelectors(
  options: AgnosticLoadingSelectorsOptions = {}
): AgnosticLoadingSelectors {
  const rootSelector = options.rootSelector ?? ((state: any): Record<string, any> => state);
  const blacklist = options.blacklist ?? [];
  const whitelist = options.whitelist ?? [];

  const isEligible = (key: string): boolean =>
    whitelist.length > 0 ? whitelist.includes(key) : !blacklist.includes(key);

  const isLoadingSlice = (value: any): value is LoadingSlice =>
    !!value && typeof value === 'object' && typeof value.isLoading === 'boolean';

  const crudEntries = (state: Record<string, any>): Array<[string, LoadingSlice]> =>
    Object.entries(state || {})
      .filter(([key]) => isEligible(key))
      .filter((entry): entry is [string, LoadingSlice] => isLoadingSlice(entry[1]));

  const selectLoadingNames = createSelector(rootSelector, (state): string[] =>
    crudEntries(state)
      .filter(([, slice]) => slice.isLoading === true)
      .map(([key]) => key)
  );

  const selectIsLoading = createSelector(
    selectLoadingNames,
    (names): boolean => names.length > 0
  );

  const selectErrors = createSelector(rootSelector, (state): string[] =>
    crudEntries(state)
      .map(([, slice]) => slice.error)
      .filter((error): error is string => typeof error === 'string' && error.length > 0)
  );

  const selectError = createSelector(selectErrors, (errors): string => errors.join('\n'));

  return {selectLoadingNames, selectIsLoading, selectErrors, selectError};
}
