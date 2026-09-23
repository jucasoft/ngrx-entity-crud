import {Type} from '@angular/core';
import {ActionReducer} from '@ngrx/store';
import {Actions} from 'ngrx-entity-crud';
import {createPersistenceActions, NecPersistenceActions} from './nec-persistence-actions';
import {createPersistenceEffects, NecPersistenceEffects, NecPersistenceEffectsConfig} from './nec-persistence-effects';
import {createPersistenceReducer, necPersistenceFeatureKey, NecPersistenceState} from './nec-persistence-reducer';
import {createPersistenceSelectors, NecPersistenceSelectors} from './nec-persistence-selectors';

export type NecPersistenceConfigForSection<T> = Omit<NecPersistenceEffectsConfig<T>, 'persistenceActions'>;

/**
 * Tutto quello che serve per la persistenza locale di una sezione, creato una sola volta:
 * - `featureKey` + `reducer` → `StoreModule.forFeature(p.featureKey, p.reducer)`
 * - `effects` → `EffectsModule.forFeature([..., p.effects])`
 * - l'oggetto intero → `<nec-restore-search [persistence]="p">` (`ngrx-entity-crud/persistence-ui`)
 */
export interface NecPersistence<T> {
  readonly feature: string;
  readonly featureKey: string;
  /** `false`: cablaggio presente ma spento (nessun accesso a IndexedDB, componente trasparente). */
  readonly enabled: boolean;
  /** Azioni CRUD della sezione (quelle di `createCrudActions`, con `Restore*`). */
  readonly crudActions: Actions<T>;
  /**
   * Azioni della persistenza (`SectionCheckSuccess`, `SetSectionSaveMode`, `InitialSearch`).
   * `InitialSearch` va dispatchata all'apertura della sezione al posto di `SearchRequest`.
   */
  readonly actions: NecPersistenceActions;
  readonly reducer: ActionReducer<NecPersistenceState>;
  readonly selectors: NecPersistenceSelectors;
  readonly effects: Type<NecPersistenceEffects>;
}

/**
 * Factory unica della persistenza di una sezione. Le azioni vengono create una volta e passate a
 * reducer ed effects, quindi nessuna stringa `feature` da ripetere e far coincidere a mano.
 *
 * `enabled` e' `true` di default quando la si chiama esplicitamente; il codice generato dallo
 * schematic `store` la scrive sempre in chiaro (`false` senza `--persist`).
 */
export function createPersistence<T>(config: NecPersistenceConfigForSection<T>): NecPersistence<T> {
  const enabled = config.enabled !== false;
  const actions = createPersistenceActions(config.feature);
  return {
    feature: config.feature,
    featureKey: necPersistenceFeatureKey(config.feature),
    enabled,
    crudActions: config.actions,
    actions,
    reducer: createPersistenceReducer<T>(config.feature, actions, config.actions),
    selectors: createPersistenceSelectors(config.feature),
    effects: createPersistenceEffects<T>({...config, enabled, persistenceActions: actions}),
  };
}
