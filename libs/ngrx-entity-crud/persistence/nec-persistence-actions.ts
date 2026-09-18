import {createAction, props} from '@ngrx/store';
import {NecSectionCheck} from './models';

/**
 * `type` scoped per `feature`: chiamata sia da `createPersistenceEffects` (che dispatcha l'esito
 * del check) sia da `createPersistenceReducer` (che lo scrive nello store) — lo stesso meccanismo
 * di `createCrudActions<T>(name)` nel core, cosi' il reducer di ogni sezione riceve solo le
 * proprie azioni tramite il match sul `type`, senza filtrare `feature` a mano nel payload.
 */
export function createSectionCheckSuccessAction(feature: string) {
  return createAction(`[${feature} Persistence] Section Check Success`, props<{ check: NecSectionCheck }>());
}
