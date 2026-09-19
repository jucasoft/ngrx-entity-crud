import {ActionCreator, createAction, props} from '@ngrx/store';
import {TypedAction} from 'ngrx-entity-crud';
import {NecSaveMode, NecSectionCheck} from './models';

/**
 * `type` scoped per `feature`: chiamata sia da `createPersistenceEffects` (che dispatcha l'esito
 * del check) sia da `createPersistenceReducer` (che lo scrive nello store) — lo stesso meccanismo
 * di `createCrudActions<T>(name)` nel core, cosi' il reducer di ogni sezione riceve solo le
 * proprie azioni tramite il match sul `type`, senza filtrare `feature` a mano nel payload.
 *
 * Tipo di ritorno esplicito, con `TypedAction<string>` (copiato in `ngrx-entity-crud` da
 * `@ngrx/store/src/models` per lo stesso motivo spiegato li': senza annotazione esplicita, `tsc`
 * stampa nel `.d.ts` il tipo letterale inferito da `createAction`, che include il template literal
 * type di `feature` E la firma generica di `Action<Type>` cosi' com'e' nella versione di
 * `@ngrx/store` usata per la build — versione che puo' NON essere generica in quella installata
 * dal consumer (bug reale: `TS2315: Type 'Action' is not generic.`, riprodotto contro `@ngrx/store`
 * < 13 circa). L'annotazione esplicita forza `tsc` a stampare questo tipo stabile invece di quello
 * inferito, stesso schema gia' usato da `Actions<T>`/`SingularActions<T>` nel core.
 */
export function createSectionCheckSuccessAction(
  feature: string
): ActionCreator<string, (props: { check: NecSectionCheck }) => { check: NecSectionCheck } & TypedAction<string>> {
  return createAction(`[${feature} Persistence] Section Check Success`, props<{ check: NecSectionCheck }>());
}

/** Dispatchata dal toggle in `<nec-restore-search>`: stesso schema di scoping per `feature`. */
export function createSetSectionSaveModeAction(
  feature: string
): ActionCreator<string, (props: { mode: NecSaveMode }) => {   mode: NecSaveMode } & TypedAction<string>> {
  return createAction(`[${feature} Persistence] Set Section Save Mode`, props<{ mode: NecSaveMode }>());
}
