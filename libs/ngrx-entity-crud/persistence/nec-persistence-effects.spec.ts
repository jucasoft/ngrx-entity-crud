import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {Actions as NgrxActionsClass} from '@ngrx/effects';
import {createCrudEntityAdapter} from 'ngrx-entity-crud';
import {createPersistenceEffects} from './nec-persistence-effects';
import {NecPersistenceService} from './nec-persistence.service';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionStats} from './models';
import {createSectionCheckSuccessAction} from './nec-persistence-actions';

/**
 * Copre `createPersistenceEffects` (Fase 2 del piano): comportamento delle azioni, non I/O reale
 * su IndexedDB (quello è già coperto da `nec-persistence.service.spec.ts`, Fase 0) — qui
 * `NecPersistenceService` è un doppio di test.
 */

interface Coin {
  id: string;
  name: string;
}

const NAME = 'coins';

const flushPromises = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

function fakePersistence(overrides: Partial<Record<string, jest.Mock>> = {}): NecPersistenceService {
  return {
    stats: jest.fn().mockResolvedValue(null),
    readSection: jest.fn().mockResolvedValue(null),
    writeSearch: jest.fn().mockResolvedValue(undefined),
    purgeSection: jest.fn().mockResolvedValue(undefined),
    putDrafts: jest.fn().mockResolvedValue(undefined),
    deleteDrafts: jest.fn().mockResolvedValue(undefined),
    deleteAllDrafts: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as NecPersistenceService;
}

describe('createPersistenceEffects', () => {
  const adapter = createCrudEntityAdapter<Coin>({selectId: (m) => m.id});
  const actions = adapter.createCrudActions(NAME);

  function setup(
    overrides: Partial<Record<string, jest.Mock>> = {},
    autoRestore?: NecAutoRestoreConfig,
    globalConfig: NecPersistenceConfig | null = null
  ) {
    const persistence = fakePersistence(overrides);
    const EffectsClass = createPersistenceEffects<Coin>({
      feature: NAME,
      selectId: (c) => c.id,
      actions,
      autoRestore,
    });
    const actionsSubject = new Subject<Action>();
    const effects = new EffectsClass(new NgrxActionsClass(actionsSubject), persistence, globalConfig);
    return {effects, persistence, actionsSubject};
  }

  describe('scritture (ciclo di vita)', () => {
    it('SearchRequest -> purgeSection(feature)', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.searchRequestOn$.subscribe();

      actionsSubject.next(actions.SearchRequest({queryParams: {}}));

      expect(persistence.purgeSection).toHaveBeenCalledWith(NAME);
    });

    it('SearchSuccess -> writeSearch(feature, request, items, selectId)', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.searchSuccessOn$.subscribe();
      const request = {queryParams: {q: 'x'}};
      const items: Coin[] = [{id: '1', name: 'BTC'}];

      actionsSubject.next(actions.SearchSuccess({items, request}));

      expect(persistence.writeSearch).toHaveBeenCalledWith(NAME, request, items, expect.any(Function));
    });

    it('accumula le righe toccate entro la finestra di debounce e scrive un solo putDrafts', () => {
      jest.useFakeTimers();
      try {
        const {effects, persistence, actionsSubject} = setup({}, undefined, {debounceMs: 50});
        effects.draftsPutOn$.subscribe();

        // Due righe DIVERSE modificate nella stessa finestra: un plain debounceTime sull'azione
        // perderebbe la prima (AddManySelected), qui devono finire entrambe nello stesso putDrafts.
        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'a-edit'}]}));
        jest.advanceTimersByTime(10);
        actionsSubject.next(actions.SelectItems({items: [{id: '2', name: 'b'}]}));
        jest.advanceTimersByTime(50);

        expect(persistence.putDrafts).toHaveBeenCalledTimes(1);
        const [featureArg, items] = (persistence.putDrafts as jest.Mock).mock.calls[0];
        expect(featureArg).toBe(NAME);
        expect(items).toEqual(expect.arrayContaining([
          {id: '1', name: 'a-edit'},
          {id: '2', name: 'b'},
        ]));
      } finally {
        jest.useRealTimers();
      }
    });

    it('RemoveManySelected -> deleteDrafts(feature, ids)', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.removeManySelectedOn$.subscribe();

      actionsSubject.next(actions.RemoveManySelected({ids: ['1', '2']}));

      expect(persistence.deleteDrafts).toHaveBeenCalledWith(NAME, ['1', '2']);
    });

    it('RemoveAllSelected -> deleteAllDrafts(feature)', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.removeAllSelectedOn$.subscribe();

      actionsSubject.next(actions.RemoveAllSelected());

      expect(persistence.deleteAllDrafts).toHaveBeenCalledWith(NAME);
    });

    it('DeleteSuccess -> deleteDrafts(feature, [id])', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.deleteSuccessOn$.subscribe();

      actionsSubject.next(actions.DeleteSuccess({id: '1', request: null}));

      expect(persistence.deleteDrafts).toHaveBeenCalledWith(NAME, ['1']);
    });

    it('DeleteManySuccess -> deleteDrafts(feature, ids)', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.deleteManySuccessOn$.subscribe();

      actionsSubject.next(actions.DeleteManySuccess({ids: ['1', '2'], request: null}));

      expect(persistence.deleteDrafts).toHaveBeenCalledWith(NAME, ['1', '2']);
    });
  });

  describe('RestoreRequest -> lettura', () => {
    it('sezione presente: RestoreSuccess con items/selected/criteria ricostruiti da entities+drafts', async () => {
      const criteria = {queryParams: {q: 'x'}};
      const section = {
        criteria,
        ids: ['1', '2'],
        entities: {1: {id: '1', name: 'a'}, 2: {id: '2', name: 'b'}},
        drafts: {1: {id: '1', name: 'a-edit'}},
        count: 2,
        bytes: 100,
        at: Date.now(),
      };
      const {effects, actionsSubject} = setup({readSection: jest.fn().mockResolvedValue(section)});
      const dispatched: Action[] = [];
      effects.restoreRequestOn$.subscribe((a) => dispatched.push(a));

      actionsSubject.next(actions.RestoreRequest());
      await flushPromises();

      expect(dispatched).toEqual([
        actions.RestoreSuccess({
          items: [{id: '1', name: 'a'}, {id: '2', name: 'b'}],
          selected: [{id: '1', name: 'a-edit'}],
          criteria,
        }),
      ]);
    });

    it('nessun dato locale: RestoreFailure', async () => {
      const {effects, actionsSubject} = setup({readSection: jest.fn().mockResolvedValue(null)});
      const dispatched: Action[] = [];
      effects.restoreRequestOn$.subscribe((a) => dispatched.push(a));

      actionsSubject.next(actions.RestoreRequest());
      await flushPromises();

      expect(dispatched).toEqual([actions.RestoreFailure({error: 'Nessun dato locale per questa sezione'})]);
    });

    it('errore di lettura: RestoreFailure con il messaggio', async () => {
      const {effects, actionsSubject} = setup({readSection: jest.fn().mockRejectedValue(new Error('IDB rotto'))});
      const dispatched: Action[] = [];
      effects.restoreRequestOn$.subscribe((a) => dispatched.push(a));

      actionsSubject.next(actions.RestoreRequest());
      await flushPromises();

      expect(dispatched).toEqual([actions.RestoreFailure({error: 'IDB rotto'})]);
    });
  });

  describe('check leggero alla creazione + auto-restore', () => {
    const sectionCheckSuccess = createSectionCheckSuccessAction(NAME);

    it('nessun dato locale: SectionCheckSuccess con stats null', async () => {
      const {effects} = setup({stats: jest.fn().mockResolvedValue(null)}, {maxAgeMs: 60000});
      const dispatched: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => dispatched.push(a));

      await flushPromises();

      expect(dispatched).toEqual([sectionCheckSuccess({check: {stats: null, autoRestoreTriggered: false}})]);
    });

    it('dati entro soglia: SectionCheckSuccess con autoRestoreTriggered true, poi RestoreRequest da se\'', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 1000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000});
      const triggered: Action[] = [];
      // Nella realta' un'azione dispatchata da un effect torna sullo stream actions$ tramite lo
      // Store; qui non c'e' un vero Store, quindi la si inoltra a mano cosi' autoRestoreTriggerOn$
      // (che ascolta actions$, non autoRestoreCheckOn$ direttamente) puo' reagire.
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([actions.RestoreRequest()]);
    });

    it('dati fuori soglia di eta\': nessun RestoreRequest automatico', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 120000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('fuori soglia di bytes pur essendo dentro la soglia di eta\': nessun RestoreRequest', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 5000, draftCount: 0, at: Date.now() - 1000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000, maxBytes: 1000});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('autoRestore non configurato ne\' per sezione ne\' globalmente: nessun RestoreRequest anche con dati freschi', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now()};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('il default globale si applica quando la sezione non specifica autoRestore', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 1000};
      const {effects, actionsSubject} = setup(
        {stats: jest.fn().mockResolvedValue(stats)},
        undefined,
        {autoRestore: {maxAgeMs: 60000}}
      );
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([actions.RestoreRequest()]);
    });

    it('il parametro di sezione prevale sul default globale', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now() - 120000};
      const {effects, actionsSubject} = setup(
        {stats: jest.fn().mockResolvedValue(stats)},
        {maxAgeMs: 1000},
        {autoRestore: {maxAgeMs: 999999}}
      );
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });
  });
});
