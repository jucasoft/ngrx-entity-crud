import {TestBed} from '@angular/core/testing';
import {Action, Store} from '@ngrx/store';
import {Actions as NgrxActionsClass} from '@ngrx/effects';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {createCrudEntityAdapter} from 'ngrx-entity-crud';
import {formatAge, formatBytes, NecRestoreSearchComponent, NecRestoreSearchViewModel} from './nec-restore-search.component';
import {NecPersistenceService} from './nec-persistence.service';
import {createPersistenceSelectors, NecPersistenceSelectors} from './nec-persistence-selectors';
import {NecSectionCheck, NecSectionStats} from './models';

const flush = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

describe('formatBytes', () => {
  it('mostra i byte sotto 1 KB', () => {
    expect(formatBytes(512)).toBe('512 B');
  });

  it('arrotonda ai KB sotto 1 MB', () => {
    expect(formatBytes(340 * 1024)).toBe('340 KB');
  });

  it('mostra i MB con un decimale oltre 1 MB', () => {
    expect(formatBytes(1.2 * 1024 * 1024)).toBe('1.2 MB');
  });
});

describe('formatAge', () => {
  it('usa "today" per lo stesso giorno', () => {
    const now = new Date(2026, 0, 15, 18, 42).getTime();
    const at = new Date(2026, 0, 15, 9, 0).getTime();
    expect(formatAge(at, now)).toMatch(/^today /);
  });

  it('usa "yesterday" per il giorno precedente', () => {
    const now = new Date(2026, 0, 15, 18, 42).getTime();
    const at = new Date(2026, 0, 14, 22, 0).getTime();
    expect(formatAge(at, now)).toMatch(/^yesterday /);
  });

  it('usa la data assoluta oltre "yesterday"', () => {
    const now = new Date(2026, 0, 15, 18, 42).getTime();
    const at = new Date(2026, 0, 10, 9, 0).getTime();
    const result = formatAge(at, now);
    expect(result).not.toMatch(/^today /);
    expect(result).not.toMatch(/^yesterday /);
  });
});

/**
 * Copre la derivazione dello stato (Fase 3 del piano, rivista dopo Fase 4): la vm deriva da
 * `selectors.sectionCheck` letto dallo store (`createPersistenceSelectors`) + il flusso di azioni,
 * senza mai ripetere `stats(feature)` ne' risolvere una classe Effects via `Injector`.
 */
describe('NecRestoreSearchComponent', () => {
  interface Coin {
    id: string;
    name: string;
  }

  const adapter = createCrudEntityAdapter<Coin>({selectId: (m) => m.id});
  const actions = adapter.createCrudActions('coins');

  // `NecPersistenceSelectors.sectionCheck` e' un vero MemoizedSelector (`.release`/`.projector`,
  // non solo una call signature): il doppio si costruisce con la stessa factory di produzione
  // (Task 4), non con una arrow function fatta a mano che non implementerebbe l'interfaccia.
  const selectors: NecPersistenceSelectors = createPersistenceSelectors('coins');

  let dispatch: jest.Mock;
  let select: jest.Mock;
  let actionsSubject: Subject<Action>;
  let checkSubject: Subject<NecSectionCheck>;
  let pendingWrites$: BehaviorSubject<number>;
  let estimateStorage: jest.Mock;
  let component: NecRestoreSearchComponent<Coin>;
  let vmSubscription: Subscription;
  let latestVm: NecRestoreSearchViewModel | undefined;

  const stats: NecSectionStats = {
    feature: 'coins',
    count: 100,
    bytes: 340 * 1024,
    draftCount: 12,
    at: Date.now(),
  };

  /** `pendingWrites$` reale e' una BehaviorSubject (Fase 0): un fresh subscriber la vede subito. */
  function createComponent(): NecRestoreSearchComponent<Coin> {
    const fixture = TestBed.createComponent(NecRestoreSearchComponent<Coin>);
    const created = fixture.componentInstance;
    created.feature = 'coins';
    created.selectors = selectors;
    created.actions = actions;
    fixture.detectChanges(); // esegue ngOnInit
    return created;
  }

  beforeEach(() => {
    dispatch = jest.fn();
    actionsSubject = new Subject();
    checkSubject = new Subject<NecSectionCheck>();
    pendingWrites$ = new BehaviorSubject<number>(0);
    estimateStorage = jest.fn().mockResolvedValue(null);
    // Il componente chiama sempre store.select(this.selectors.sectionCheck): quale selector venga
    // passato non conta per questo doppio, restituisce sempre lo stesso Subject controllato dal test.
    select = jest.fn().mockReturnValue(checkSubject.asObservable());

    TestBed.configureTestingModule({
      imports: [NecRestoreSearchComponent],
      providers: [
        {provide: Store, useValue: {dispatch, select}},
        {provide: NgrxActionsClass, useValue: new NgrxActionsClass(actionsSubject)},
        {
          provide: NecPersistenceService,
          useValue: {pendingWrites$, estimateStorage},
        },
      ],
    });

    component = createComponent();
    // Sottoscrizione UNICA e persistente per tutto il test: `combineLatest` e' cold, una nuova
    // `.subscribe()` per ogni asserzione perderebbe i valori gia' emessi dai Subject non-replay.
    latestVm = undefined;
    vmSubscription = component.vm$.subscribe((vm) => {
      latestVm = vm;
    });
  });

  afterEach(() => {
    vmSubscription.unsubscribe();
  });

  /** Narrowing senza non-null assertion (vietata dal lint): fallisce il test se manca ancora. */
  function currentVm(): NecRestoreSearchViewModel {
    expect(latestVm).toBeDefined();
    return latestVm as NecRestoreSearchViewModel;
  }

  it('stato iniziale, prima di ogni esito del check: none', () => {
    expect(currentVm().state).toBe('none');
    expect(select).toHaveBeenCalledWith(selectors.sectionCheck);
  });

  it('check senza dati locali: none', () => {
    checkSubject.next({stats: null, autoRestoreTriggered: false, saveMode: 'on-draft'});
    expect(currentVm().state).toBe('none');
  });

  it('check con dati locali, fuori soglia: prompt con le stats', () => {
    checkSubject.next({stats, autoRestoreTriggered: false, saveMode: 'on-draft'});
    const vm = currentVm();
    expect(vm.state).toBe('prompt');
    expect(vm.stats).toEqual(stats);
  });

  it('check con autoRestoreTriggered + RestoreRequest in volo: auto-restoring', () => {
    checkSubject.next({stats, autoRestoreTriggered: true, saveMode: 'on-draft'});
    actionsSubject.next(actions.RestoreRequest());
    expect(currentVm().state).toBe('auto-restoring');
  });

  it('auto-restoring seguito da RestoreSuccess: torna a none, non a prompt', () => {
    checkSubject.next({stats, autoRestoreTriggered: true, saveMode: 'on-draft'});
    actionsSubject.next(actions.RestoreRequest());
    actionsSubject.next(actions.RestoreSuccess({items: [], selected: [], criteria: {}}));
    expect(currentVm().state).toBe('none');
  });

  it('click su Restore: dispaccia RestoreRequest e passa a manual-restoring', () => {
    checkSubject.next({stats, autoRestoreTriggered: false, saveMode: 'on-draft'});
    expect(currentVm().state).toBe('prompt');

    component.restore();
    actionsSubject.next(actions.RestoreRequest());

    expect(dispatch).toHaveBeenCalledWith(actions.RestoreRequest());
    expect(currentVm().state).toBe('manual-restoring');
  });

  it('RestoreFailure durante un restore manuale: torna a prompt con l\'errore visibile', () => {
    checkSubject.next({stats, autoRestoreTriggered: false, saveMode: 'on-draft'});
    component.restore();
    actionsSubject.next(actions.RestoreRequest());

    actionsSubject.next(actions.RestoreFailure({error: 'IndexedDB non disponibile'}));

    const vm = currentVm();
    expect(vm.state).toBe('prompt');
    expect(vm.restoreError).toBe('IndexedDB non disponibile');
  });

  it('New search chiede conferma prima di scartare le bozze, poi torna a none', () => {
    checkSubject.next({stats, autoRestoreTriggered: false, saveMode: 'on-draft'});

    expect(component.dismissPending()).toBe(false);
    component.requestNewSearch();
    expect(component.dismissPending()).toBe(true);
    component.cancelNewSearch();
    expect(component.dismissPending()).toBe(false);
    expect(currentVm().state).toBe('prompt');

    component.requestNewSearch();
    component.confirmNewSearch();

    expect(currentVm().state).toBe('none');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('pendingWrites si riflette nella vm indipendentemente dallo stato principale', () => {
    checkSubject.next({stats: null, autoRestoreTriggered: false, saveMode: 'on-draft'});
    pendingWrites$.next(3);

    expect(currentVm().pendingWrites).toBe(3);
  });

  it('saveMode nella vm riflette il check, default "on-draft" prima di ogni check', () => {
    expect(currentVm().saveMode).toBe('on-draft');

    checkSubject.next({stats: null, autoRestoreTriggered: false, saveMode: 'always'});

    expect(currentVm().saveMode).toBe('always');
  });

  it('toggleSaveMode dispaccia SetSectionSaveMode invertendo lo stato corrente', () => {
    component.toggleSaveMode('on-draft');
    expect(dispatch).toHaveBeenCalledWith({type: '[coins Persistence] Set Section Save Mode', mode: 'always'});

    component.toggleSaveMode('always');
    expect(dispatch).toHaveBeenCalledWith({type: '[coins Persistence] Set Section Save Mode', mode: 'on-draft'});
  });

  it('quota quasi esaurita: quotaWarning true, letta una sola volta da estimateStorage', async () => {
    estimateStorage.mockResolvedValue({quota: 100, usage: 95});

    const freshComponent = createComponent();
    let freshVm: NecRestoreSearchViewModel | undefined;
    const sub = freshComponent.vm$.subscribe((vm) => {
      freshVm = vm;
    });

    await flush();

    expect(freshVm?.quotaWarning).toBe(true);
    expect(estimateStorage).toHaveBeenCalledTimes(2);
    sub.unsubscribe();
  });
});
