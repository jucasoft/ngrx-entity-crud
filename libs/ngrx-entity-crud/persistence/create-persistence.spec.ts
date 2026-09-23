import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {Actions as NgrxActionsClass} from '@ngrx/effects';
import {createCrudEntityAdapter} from 'ngrx-entity-crud';
import {createPersistence} from './create-persistence';
import {necPersistenceFeatureKey} from './nec-persistence-reducer';
import {NecPersistenceService} from './nec-persistence.service';

interface Coin {
  id: string;
  name: string;
}

describe('createPersistence', () => {
  const adapter = createCrudEntityAdapter<Coin>({selectId: (c) => c.id});
  const actions = adapter.createCrudActions('coins');

  it('raccoglie in un solo oggetto feature, featureKey, azioni, reducer, selectors ed effects', () => {
    const persistence = createPersistence<Coin>({feature: 'coins', selectId: (c) => c.id, actions});

    expect(persistence.feature).toBe('coins');
    expect(persistence.featureKey).toBe(necPersistenceFeatureKey('coins'));
    expect(persistence.crudActions).toBe(actions);
    expect(persistence.actions.SectionCheckSuccess.type).toBe('[coins Persistence] Section Check Success');
    expect(persistence.actions.SetSectionSaveMode.type).toBe('[coins Persistence] Set Section Save Mode');
    expect(typeof persistence.reducer).toBe('function');
    expect(persistence.selectors.sectionCheck).toBeDefined();
    expect(typeof persistence.effects).toBe('function');
  });

  it('enabled di default true, rispettato se passato esplicitamente', () => {
    expect(createPersistence<Coin>({feature: 'coins', selectId: (c) => c.id, actions}).enabled).toBe(true);
    expect(createPersistence<Coin>({feature: 'coins', selectId: (c) => c.id, actions, enabled: false}).enabled).toBe(false);
  });

  it('il reducer reagisce alle azioni del bundle (stessa istanza, nessuna stringa da far coincidere)', () => {
    const persistence = createPersistence<Coin>({feature: 'coins', selectId: (c) => c.id, actions});

    const state = persistence.reducer(undefined, persistence.actions.SetSectionSaveMode({mode: 'always'}));

    expect(state.check?.saveMode).toBe('always');
  });

  it('enabled: false arriva agli effects: nessun accesso a IndexedDB', async () => {
    const persistence = createPersistence<Coin>({feature: 'coins', selectId: (c) => c.id, actions, enabled: false});
    const service = {stats: jest.fn().mockResolvedValue(null), getSaveMode: jest.fn().mockResolvedValue('on-draft')};
    const effects = new persistence.effects(
      new NgrxActionsClass(new Subject<Action>()),
      service as unknown as NecPersistenceService,
      null
    );
    effects.autoRestoreCheckOn$.subscribe();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.stats).not.toHaveBeenCalled();
  });
});
