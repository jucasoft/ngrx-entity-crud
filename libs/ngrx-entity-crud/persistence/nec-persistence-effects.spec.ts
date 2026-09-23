import {Subject} from 'rxjs';
import {Action} from '@ngrx/store';
import {Actions as NgrxActionsClass} from '@ngrx/effects';
import {createCrudEntityAdapter} from 'ngrx-entity-crud';
import {createPersistenceEffects} from './nec-persistence-effects';
import {NecPersistenceService} from './nec-persistence.service';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionStats} from './models';
import {createPersistenceActions, createSectionCheckSuccessAction, createSetSectionSaveModeAction} from './nec-persistence-actions';

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
    getSaveMode: jest.fn().mockResolvedValue('on-draft'),
    setSaveMode: jest.fn().mockResolvedValue(undefined),
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

    it('SearchSuccess da sola non scrive nulla (il blocco search si scrive alla prima bozza, non qui)', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.searchSuccessOn$.subscribe();
      const request = {queryParams: {q: 'x'}};
      const items: Coin[] = [{id: '1', name: 'BTC'}];

      actionsSubject.next(actions.SearchSuccess({items, request}));

      expect(persistence.writeSearch).not.toHaveBeenCalled();
    });

    it('la prima bozza dopo una ricerca scrive anche il blocco search (criteria/items dell\'ultima SearchSuccess)', () => {
      jest.useFakeTimers();
      try {
        const {effects, persistence, actionsSubject} = setup({}, undefined, {debounceMs: 50});
        effects.searchSuccessOn$.subscribe();
        effects.draftsPutOn$.subscribe();
        const request = {queryParams: {q: 'x'}};
        const items: Coin[] = [{id: '1', name: 'BTC'}, {id: '2', name: 'ETH'}];

        actionsSubject.next(actions.SearchSuccess({items, request}));
        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'BTC-edit'}]}));
        jest.advanceTimersByTime(50);

        expect(persistence.writeSearch).toHaveBeenCalledWith(NAME, request, items, expect.any(Function));
      } finally {
        jest.useRealTimers();
      }
    });

    it('SearchRequest azzera la ricerca in cache: una bozza dopo una nuova ricerca non riscrive quella vecchia', () => {
      jest.useFakeTimers();
      try {
        const {effects, persistence, actionsSubject} = setup({}, undefined, {debounceMs: 50});
        effects.searchRequestOn$.subscribe();
        effects.searchSuccessOn$.subscribe();
        effects.draftsPutOn$.subscribe();
        const oldItems: Coin[] = [{id: '1', name: 'BTC'}];

        actionsSubject.next(actions.SearchSuccess({items: oldItems, request: {queryParams: {q: 'old'}}}));
        actionsSubject.next(actions.SearchRequest({queryParams: {q: 'new'}}));
        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'BTC-edit'}]}));
        jest.advanceTimersByTime(50);

        expect(persistence.writeSearch).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('una seconda bozza, in un giro di debounce successivo, non riscrive il blocco search', () => {
      jest.useFakeTimers();
      try {
        const {effects, persistence, actionsSubject} = setup({}, undefined, {debounceMs: 50});
        effects.searchSuccessOn$.subscribe();
        effects.draftsPutOn$.subscribe();
        const request = {queryParams: {q: 'x'}};
        const items: Coin[] = [{id: '1', name: 'BTC'}, {id: '2', name: 'ETH'}];

        actionsSubject.next(actions.SearchSuccess({items, request}));
        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'BTC-edit'}]}));
        jest.advanceTimersByTime(50);
        actionsSubject.next(actions.AddManySelected({items: [{id: '2', name: 'ETH-edit'}]}));
        jest.advanceTimersByTime(50);

        expect(persistence.writeSearch).toHaveBeenCalledTimes(1);
      } finally {
        jest.useRealTimers();
      }
    });

    it('accumula le righe toccate entro la finestra di debounce e scrive un solo putDrafts', async () => {
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
        // persistSearchIfNeeded() aggiunge un giro di microtask prima di putDrafts, indipendente dai fake timers.
        await Promise.resolve();

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

  describe('bozze in attesa di debounce (race con rimozioni e nuove ricerche)', () => {
    /** Sottoscrive tutti gli effect di scrittura, come farebbe EffectsModule. */
    function setupAll() {
      const ctx = setup({}, undefined, {debounceMs: 50});
      const {effects} = ctx;
      effects.searchRequestOn$.subscribe();
      effects.searchSuccessOn$.subscribe();
      effects.draftsPutOn$.subscribe();
      effects.removeManySelectedOn$.subscribe();
      effects.removeAllSelectedOn$.subscribe();
      effects.deleteSuccessOn$.subscribe();
      effects.deleteManySuccessOn$.subscribe();
      return ctx;
    }

    async function editThen(action: Action) {
      jest.useFakeTimers();
      try {
        const ctx = setupAll();
        ctx.actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'a-edit'}]}));
        jest.advanceTimersByTime(10);
        ctx.actionsSubject.next(action);
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        return ctx;
      } finally {
        jest.useRealTimers();
      }
    }

    it('RemoveManySelected entro la finestra: la bozza annullata non viene riscritta', async () => {
      const {persistence} = await editThen(actions.RemoveManySelected({ids: ['1']}));
      expect(persistence.putDrafts).not.toHaveBeenCalled();
    });

    it('RemoveAllSelected entro la finestra: nessuna bozza riscritta', async () => {
      const {persistence} = await editThen(actions.RemoveAllSelected());
      expect(persistence.putDrafts).not.toHaveBeenCalled();
    });

    it('DeleteSuccess entro la finestra: la bozza della riga cancellata non viene riscritta', async () => {
      const {persistence} = await editThen(actions.DeleteSuccess({id: '1', request: null}));
      expect(persistence.putDrafts).not.toHaveBeenCalled();
    });

    it('DeleteManySuccess entro la finestra: la bozza delle righe cancellate non viene riscritta', async () => {
      const {persistence} = await editThen(actions.DeleteManySuccess({ids: ['1'], request: null}));
      expect(persistence.putDrafts).not.toHaveBeenCalled();
    });

    it('SearchRequest entro la finestra: nessuna bozza orfana scritta dopo purgeSection', async () => {
      const {persistence} = await editThen(actions.SearchRequest({queryParams: {}}));
      expect(persistence.putDrafts).not.toHaveBeenCalled();
    });

    it('la rimozione di una riga non scarta le bozze delle altre righe in attesa', async () => {
      jest.useFakeTimers();
      try {
        const {persistence, actionsSubject} = setupAll();
        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'a-edit'}, {id: '2', name: 'b-edit'}]}));
        actionsSubject.next(actions.RemoveManySelected({ids: ['1']}));
        jest.advanceTimersByTime(50);
        await Promise.resolve();

        expect(persistence.putDrafts).toHaveBeenCalledTimes(1);
        expect((persistence.putDrafts as jest.Mock).mock.calls[0][1]).toEqual([{id: '2', name: 'b-edit'}]);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('scrittura del blocco search fallita', () => {
    it('writeSearch rifiutata: la bozza successiva ritenta la scrittura del blocco search', async () => {
      jest.useFakeTimers();
      try {
        const writeSearch = jest.fn()
          .mockRejectedValueOnce(new Error('QuotaExceededError'))
          .mockResolvedValue(undefined);
        const {effects, persistence, actionsSubject} = setup({writeSearch}, undefined, {debounceMs: 50});
        effects.searchSuccessOn$.subscribe();
        effects.draftsPutOn$.subscribe();
        const request = {queryParams: {q: 'x'}};
        const items: Coin[] = [{id: '1', name: 'BTC'}];

        actionsSubject.next(actions.SearchSuccess({items, request}));
        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'BTC-edit'}]}));
        jest.advanceTimersByTime(50);
        await Promise.resolve();
        await Promise.resolve();

        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'BTC-edit-2'}]}));
        jest.advanceTimersByTime(50);
        await Promise.resolve();

        expect(persistence.writeSearch).toHaveBeenCalledTimes(2);
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('enabled: false (cablaggio presente ma spento)', () => {
    function setupDisabled() {
      const persistence = fakePersistence();
      const EffectsClass = createPersistenceEffects<Coin>({feature: NAME, selectId: (c) => c.id, actions, enabled: false});
      const actionsSubject = new Subject<Action>();
      const effects = new EffectsClass(new NgrxActionsClass(actionsSubject), persistence, null);
      return {effects, persistence, actionsSubject};
    }

    it('nessun accesso a IndexedDB alla creazione (niente check di freschezza)', async () => {
      const {effects, persistence} = setupDisabled();
      const emitted: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => emitted.push(a));
      await flushPromises();

      expect(persistence.stats).not.toHaveBeenCalled();
      expect(persistence.getSaveMode).not.toHaveBeenCalled();
      expect(emitted).toEqual([]);
    });

    it('nessun accesso a IndexedDB su ricerca, bozze, rimozioni o RestoreRequest', async () => {
      jest.useFakeTimers();
      try {
        const {effects, persistence, actionsSubject} = setupDisabled();
        effects.searchRequestOn$.subscribe();
        effects.searchSuccessOn$.subscribe();
        effects.draftsPutOn$.subscribe();
        effects.removeManySelectedOn$.subscribe();
        effects.removeAllSelectedOn$.subscribe();
        effects.deleteSuccessOn$.subscribe();
        effects.deleteManySuccessOn$.subscribe();
        effects.restoreRequestOn$.subscribe();
        effects.setSaveModeOn$.subscribe();
        effects.autoRestoreTriggerOn$.subscribe();

        actionsSubject.next(actions.SearchRequest({queryParams: {}}));
        actionsSubject.next(actions.SearchSuccess({items: [{id: '1', name: 'a'}], request: {queryParams: {}}}));
        actionsSubject.next(actions.AddManySelected({items: [{id: '1', name: 'a-edit'}]}));
        actionsSubject.next(actions.RemoveManySelected({ids: ['1']}));
        actionsSubject.next(actions.RemoveAllSelected());
        actionsSubject.next(actions.RestoreRequest());
        jest.advanceTimersByTime(1000);
        await Promise.resolve();

        Object.values(persistence).forEach((fn) => expect(fn).not.toHaveBeenCalled());
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('gruppo di azioni della persistenza passato in config', () => {
    it('dispatcha SectionCheckSuccess del gruppo ricevuto', async () => {
      const group = createPersistenceActions(NAME);
      const persistence = fakePersistence();
      const EffectsClass = createPersistenceEffects<Coin>({
        feature: NAME,
        selectId: (c) => c.id,
        actions,
        persistenceActions: group,
      });
      const effects = new EffectsClass(new NgrxActionsClass(new Subject<Action>()), persistence, null);
      const emitted: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => emitted.push(a));
      await flushPromises();

      expect(emitted.map((a) => a.type)).toEqual([group.SectionCheckSuccess.type]);
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

      expect(dispatched).toEqual([sectionCheckSuccess({check: {stats: null, autoRestoreTriggered: false, saveMode: 'on-draft'}})]);
    });

    it('legge saveMode da persistence.getSaveMode e lo include nel check dispatchato', async () => {
      const {effects} = setup({getSaveMode: jest.fn().mockResolvedValue('always')});
      const dispatched: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => dispatched.push(a));

      await flushPromises();

      expect(dispatched).toEqual([sectionCheckSuccess({check: {stats: null, autoRestoreTriggered: false, saveMode: 'always'}})]);
    });

    it('search salvato ma nessuna bozza (draftCount 0): trattato come nessun dato locale', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now()};
      const {effects} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000});
      const dispatched: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => dispatched.push(a));

      await flushPromises();

      expect(dispatched).toEqual([sectionCheckSuccess({check: {stats: null, autoRestoreTriggered: false, saveMode: 'on-draft'}})]);
    });

    it('saveMode "always": draftCount 0 NON viene filtrato, il prompt mostra comunque i risultati salvati', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 0, at: Date.now()};
      const {effects} = setup({
        stats: jest.fn().mockResolvedValue(stats),
        getSaveMode: jest.fn().mockResolvedValue('always'),
      });
      const dispatched: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => dispatched.push(a));

      await flushPromises();

      expect(dispatched).toEqual([sectionCheckSuccess({check: {stats, autoRestoreTriggered: false, saveMode: 'always'}})]);
    });

    it('dati entro soglia: SectionCheckSuccess con autoRestoreTriggered true, poi RestoreRequest da se\'', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 1, at: Date.now() - 1000};
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
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 1, at: Date.now() - 120000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('fuori soglia di bytes pur essendo dentro la soglia di eta\': nessun RestoreRequest', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 5000, draftCount: 1, at: Date.now() - 1000};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)}, {maxAgeMs: 60000, maxBytes: 1000});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('autoRestore non configurato ne\' per sezione ne\' globalmente: nessun RestoreRequest anche con dati freschi', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 1, at: Date.now()};
      const {effects, actionsSubject} = setup({stats: jest.fn().mockResolvedValue(stats)});
      const triggered: Action[] = [];
      effects.autoRestoreCheckOn$.subscribe((a) => actionsSubject.next(a));
      effects.autoRestoreTriggerOn$.subscribe((a) => triggered.push(a));

      await flushPromises();

      expect(triggered).toEqual([]);
    });

    it('il default globale si applica quando la sezione non specifica autoRestore', async () => {
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 1, at: Date.now() - 1000};
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
      const stats: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 1, at: Date.now() - 120000};
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

  describe('SetSectionSaveMode', () => {
    const setSectionSaveMode = createSetSectionSaveModeAction(NAME);

    it('persiste la scelta: persistence.setSaveMode(feature, mode)', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.setSaveModeOn$.subscribe();

      actionsSubject.next(setSectionSaveMode({mode: 'always'}));

      expect(persistence.setSaveMode).toHaveBeenCalledWith(NAME, 'always');
    });

    it('mode "always": una SearchSuccess successiva scrive subito il blocco search, senza aspettare una bozza', () => {
      const {effects, persistence, actionsSubject} = setup();
      effects.setSaveModeOn$.subscribe();
      effects.searchSuccessOn$.subscribe();
      const request = {queryParams: {q: 'x'}};
      const items: Coin[] = [{id: '1', name: 'BTC'}];

      actionsSubject.next(setSectionSaveMode({mode: 'always'}));
      actionsSubject.next(actions.SearchSuccess({items, request}));

      expect(persistence.writeSearch).toHaveBeenCalledWith(NAME, request, items, expect.any(Function));
    });
  });

  /**
   * La sezione generata cercava all'apertura con `SearchRequest`, che azzera (purgeSection) i dati
   * locali prima che l'utente possa ripristinarli: al reload le bozze sparivano. `InitialSearch`
   * cerca solo se non c'e' nulla da ripristinare.
   */
  describe('InitialSearch (ricerca all\'apertura della sezione)', () => {
    const {InitialSearch} = createPersistenceActions(NAME);
    const criteria = {queryParams: {q: 'x'}};
    const withDrafts: NecSectionStats = {feature: NAME, count: 10, bytes: 500, draftCount: 1, at: Date.now()};

    function run(overrides: Partial<Record<string, jest.Mock>> = {}, autoRestore?: NecAutoRestoreConfig) {
      const context = setup(overrides, autoRestore);
      const emitted: Action[] = [];
      context.effects.autoRestoreCheckOn$.subscribe();
      context.effects.searchRequestOn$.subscribe();
      context.effects.restoreRequestOn$.subscribe();
      context.effects.initialSearchOn$.subscribe((a) => emitted.push(a));
      return {...context, emitted};
    }

    it('nessun dato locale: SearchRequest con gli stessi criteri', async () => {
      const {actionsSubject, emitted} = run();
      await flushPromises();

      actionsSubject.next(InitialSearch(criteria));

      expect(emitted).toEqual([actions.SearchRequest(criteria)]);
    });

    it('arrivata prima dell\'esito del check: aspetta il check, poi cerca', async () => {
      const {actionsSubject, emitted} = run();

      actionsSubject.next(InitialSearch(criteria));
      expect(emitted).toEqual([]);
      await flushPromises();

      expect(emitted).toEqual([actions.SearchRequest(criteria)]);
    });

    it('dati locali da ripristinare: nessuna SearchRequest (niente purge), anche riaprendo la sezione', async () => {
      const {actionsSubject, emitted, persistence} = run({stats: jest.fn().mockResolvedValue(withDrafts)});
      await flushPromises();

      actionsSubject.next(InitialSearch(criteria));
      actionsSubject.next(InitialSearch(criteria));
      await flushPromises();

      expect(emitted).toEqual([]);
      expect(persistence.purgeSection).not.toHaveBeenCalled();
    });

    it('dati locali con autoRestore scattato: nessuna SearchRequest (il ripristino e\' gia\' partito)', async () => {
      const {actionsSubject, emitted} = run({stats: jest.fn().mockResolvedValue(withDrafts)}, {maxAgeMs: 60000});
      await flushPromises();

      actionsSubject.next(InitialSearch(criteria));

      expect(emitted).toEqual([]);
    });

    it('check fallito: cerca comunque (nessun dato locale leggibile)', async () => {
      const {actionsSubject, emitted} = run({stats: jest.fn().mockRejectedValue(new Error('idb'))});
      await flushPromises();

      actionsSubject.next(InitialSearch(criteria));

      expect(emitted).toEqual([actions.SearchRequest(criteria)]);
    });

    it.each([
      ['una ricerca', () => actions.SearchRequest({queryParams: {}})],
      ['un ripristino', () => actions.RestoreRequest()],
    ])('dopo %s nella sessione i dati locali sono gia\' decisi: riaprendo la sezione cerca', async (_label, decision) => {
      const {actionsSubject, emitted} = run({stats: jest.fn().mockResolvedValue(withDrafts)});
      await flushPromises();

      actionsSubject.next(decision());
      actionsSubject.next(InitialSearch(criteria));

      expect(emitted).toEqual([actions.SearchRequest(criteria)]);
    });

    it('enabled: false: SearchRequest subito, senza accessi a IndexedDB', () => {
      const persistence = fakePersistence();
      const EffectsClass = createPersistenceEffects<Coin>({feature: NAME, selectId: (c) => c.id, actions, enabled: false});
      const actionsSubject = new Subject<Action>();
      const effects = new EffectsClass(new NgrxActionsClass(actionsSubject), persistence, null);
      const emitted: Action[] = [];
      effects.initialSearchOn$.subscribe((a) => emitted.push(a));

      actionsSubject.next(InitialSearch(criteria));

      expect(emitted).toEqual([actions.SearchRequest(criteria)]);
      Object.values(persistence).forEach((fn) => expect(fn).not.toHaveBeenCalled());
    });
  });
});
