import {Type} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Action, Store} from '@ngrx/store';
import {Actions as NgrxActionsClass} from '@ngrx/effects';
import {BehaviorSubject, Subject, Subscription} from 'rxjs';
import {createCrudEntityAdapter} from 'ngrx-entity-crud';
import {formatAge, formatBytes, NecRestoreSearchComponent, NecRestoreSearchViewModel} from './nec-restore-search.component';
import {NecPersistenceService} from './nec-persistence.service';
import {NecPersistenceEffects} from './nec-persistence-effects';
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
 * Copre la derivazione dello stato (Fase 3 del piano): `sectionCheck$` + il flusso di azioni
 * decidono quale dei cinque stati va mostrato, senza mai ripetere `stats(feature)`.
 */
describe('NecRestoreSearchComponent', () => {
  interface Coin {
    id: string;
    name: string;
  }

  const adapter = createCrudEntityAdapter<Coin>({selectId: (m) => m.id});
  const actions = adapter.createCrudActions('coins');

  class FakeSectionEffects {
    sectionCheck$ = new Subject<NecSectionCheck>();
  }

  let dispatch: jest.Mock;
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
    // Il doppio nel test espone solo `sectionCheck$`, l'unico membro che il componente legge
    // davvero: cast esplicito, non ha senso implementare l'intera interfaccia per un test.
    created.effects = FakeSectionEffects as unknown as Type<NecPersistenceEffects>;
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

    TestBed.configureTestingModule({
      imports: [NecRestoreSearchComponent],
      providers: [
        {provide: Store, useValue: {dispatch}},
        {provide: NgrxActionsClass, useValue: new NgrxActionsClass(actionsSubject)},
        {
          provide: NecPersistenceService,
          useValue: {pendingWrites$, estimateStorage},
        },
        {provide: FakeSectionEffects, useValue: {sectionCheck$: checkSubject}},
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
  });

  it('check senza dati locali: none', () => {
    checkSubject.next({stats: null, autoRestoreTriggered: false});
    expect(currentVm().state).toBe('none');
  });

  it('check con dati locali, fuori soglia: prompt con le stats', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});
    const vm = currentVm();
    expect(vm.state).toBe('prompt');
    expect(vm.stats).toEqual(stats);
  });

  it('check con autoRestoreTriggered + RestoreRequest in volo: auto-restoring', () => {
    checkSubject.next({stats, autoRestoreTriggered: true});
    actionsSubject.next(actions.RestoreRequest());
    expect(currentVm().state).toBe('auto-restoring');
  });

  it('auto-restoring seguito da RestoreSuccess: torna a none, non a prompt', () => {
    checkSubject.next({stats, autoRestoreTriggered: true});
    actionsSubject.next(actions.RestoreRequest());
    actionsSubject.next(actions.RestoreSuccess({items: [], selected: [], criteria: {}}));
    expect(currentVm().state).toBe('none');
  });

  it('click su Restore: dispaccia RestoreRequest e passa a manual-restoring', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});
    expect(currentVm().state).toBe('prompt');

    component.restore();
    actionsSubject.next(actions.RestoreRequest());

    expect(dispatch).toHaveBeenCalledWith(actions.RestoreRequest());
    expect(currentVm().state).toBe('manual-restoring');
  });

  it('RestoreFailure durante un restore manuale: torna a prompt con l\'errore visibile', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});
    component.restore();
    actionsSubject.next(actions.RestoreRequest());

    actionsSubject.next(actions.RestoreFailure({error: 'IndexedDB non disponibile'}));

    const vm = currentVm();
    expect(vm.state).toBe('prompt');
    expect(vm.restoreError).toBe('IndexedDB non disponibile');
  });

  it('New search chiede conferma prima di scartare le bozze, poi torna a none', () => {
    checkSubject.next({stats, autoRestoreTriggered: false});

    expect(component.dismissPending()).toBe(false);
    component.requestNewSearch();
    expect(component.dismissPending()).toBe(true);
    // annullare la conferma non deve cambiare lo stato della vm
    component.cancelNewSearch();
    expect(component.dismissPending()).toBe(false);
    expect(currentVm().state).toBe('prompt');

    component.requestNewSearch();
    component.confirmNewSearch();

    expect(currentVm().state).toBe('none');
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('pendingWrites si riflette nella vm indipendentemente dallo stato principale', () => {
    checkSubject.next({stats: null, autoRestoreTriggered: false});
    pendingWrites$.next(3);

    expect(currentVm().pendingWrites).toBe(3);
  });

  it('quota quasi esaurita: quotaWarning true, letta una sola volta da estimateStorage', async () => {
    // `estimateStorage` viene chiamato una sola volta in ngOnInit: il mock va impostato PRIMA
    // di creare il componente, altrimenti la nuova risoluzione arriva troppo tardi.
    estimateStorage.mockResolvedValue({quota: 100, usage: 95});

    const freshComponent = createComponent();
    let freshVm: NecRestoreSearchViewModel | undefined;
    const sub = freshComponent.vm$.subscribe((vm) => {
      freshVm = vm;
    });

    await flush();

    expect(freshVm?.quotaWarning).toBe(true);
    // Una chiamata dal componente del beforeEach, una da questo.
    expect(estimateStorage).toHaveBeenCalledTimes(2);
    sub.unsubscribe();
  });
});
