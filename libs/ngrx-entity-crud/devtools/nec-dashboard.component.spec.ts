import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NecDashboardComponent} from './nec-dashboard.component';
import {NecLocalStorageProbeService} from './probes/nec-local-storage-probe.service';
import {NecIndexedDbProbeService} from './probes/nec-indexeddb-probe.service';
import {NecStoreProbeService} from './probes/nec-store-probe.service';
import {NecStoreReport} from './models';

describe('NecDashboardComponent (azioni di reset)', () => {
  const report: NecStoreReport = {
    slices: [
      {key: 'coin', kind: 'plural', isLoading: false, isLoaded: true, error: null, entityCount: 2, responsesCount: 1, hasData: true},
      {key: 'profile', kind: 'singular', isLoading: false, isLoaded: true, error: null, responsesCount: 0, hasData: false},
    ],
    loadingNames: [],
    errors: [],
  };

  let fixture: ComponentFixture<NecDashboardComponent>;
  let component: NecDashboardComponent;
  let storeProbe: {reset: jest.Mock; resetResponses: jest.Mock; read: jest.Mock; readWithLazyReport: jest.Mock};
  let idbProbe: {read: jest.Mock; readStoreEntries: jest.Mock};

  beforeEach(() => {
    storeProbe = {
      reset: jest.fn(),
      resetResponses: jest.fn(),
      read: jest.fn().mockReturnValue(report),
      readWithLazyReport: jest.fn().mockResolvedValue(report),
    };
    const localProbe = {
      read: jest.fn().mockReturnValue({available: false, type: 'local', entries: [], count: 0, totalBytesUtf16: 0, totalBytesUtf8: 0}),
      estimate: jest.fn().mockResolvedValue({available: false}),
      readValue: jest.fn().mockReturnValue(null),
    };
    idbProbe = {
      read: jest.fn().mockResolvedValue({available: false, enumerable: false, adapter: null, databases: []}),
      readStoreEntries: jest.fn().mockResolvedValue({
        db: 'app',
        store: 's1',
        entries: [{key: '1', value: {a: 1}}],
        total: 1,
        truncated: false,
      }),
    };

    TestBed.configureTestingModule({
      imports: [NecDashboardComponent],
      providers: [
        {provide: NecLocalStorageProbeService, useValue: localProbe},
        {provide: NecIndexedDbProbeService, useValue: idbProbe},
        {provide: NecStoreProbeService, useValue: storeProbe},
      ],
    });

    fixture = TestBed.createComponent(NecDashboardComponent);
    component = fixture.componentInstance;
    // Niente detectChanges: evita il refresh automatico di ngOnInit. Lo stub di refresh isola
    // l'unità e lo stato dello store viene impostato a mano in modo deterministico.
    jest.spyOn(component, 'refresh').mockResolvedValue();
    component.storeReport.set(report);
  });

  it('confirmReset dispaccia il Reset, emette sliceReset, azzera il pending e ricarica', () => {
    const emitted: string[] = [];
    component.sliceReset.subscribe((k) => emitted.push(k));

    component.requestReset('coin');
    expect(component.pendingResetKey()).toBe('coin');

    component.confirmReset('coin');
    expect(storeProbe.reset).toHaveBeenCalledWith('coin');
    expect(emitted).toEqual(['coin']);
    expect(component.pendingResetKey()).toBeNull();
    expect(component.refresh).toHaveBeenCalled();
  });

  it('confirmResetResponses dispaccia ResetResponses senza emettere sliceReset', () => {
    const emitted: string[] = [];
    component.sliceReset.subscribe((k) => emitted.push(k));

    component.requestResetResponses('coin');
    component.confirmResetResponses('coin');

    expect(storeProbe.resetResponses).toHaveBeenCalledWith('coin');
    expect(emitted).toEqual([]);
    expect(component.pendingResponsesKey()).toBeNull();
  });

  it('confirmResetAll dispaccia il Reset di tutte le slice ed emette per ciascuna', () => {
    const emitted: string[] = [];
    component.sliceReset.subscribe((k) => emitted.push(k));

    component.requestResetAll();
    expect(component.pendingResetAll()).toBe(true);

    component.confirmResetAll();
    expect(storeProbe.reset).toHaveBeenCalledWith('coin');
    expect(storeProbe.reset).toHaveBeenCalledWith('profile');
    expect(storeProbe.reset).toHaveBeenCalledTimes(2);
    expect(emitted).toEqual(['coin', 'profile']);
    expect(component.pendingResetAll()).toBe(false);
  });

  it('le richieste di conferma sono mutuamente esclusive', () => {
    component.requestResetResponses('coin');
    expect(component.pendingResponsesKey()).toBe('coin');

    component.requestReset('profile');
    expect(component.pendingResponsesKey()).toBeNull();
    expect(component.pendingResetKey()).toBe('profile');

    component.requestResetAll();
    expect(component.pendingResetKey()).toBeNull();
    expect(component.pendingResetAll()).toBe(true);
  });

  it('cancelPending azzera tutte le conferme pendenti', () => {
    component.requestReset('coin');
    component.cancelPending();
    expect(component.pendingResetKey()).toBeNull();
    expect(component.pendingResponsesKey()).toBeNull();
    expect(component.pendingResetAll()).toBe(false);
  });

  describe('filtro slice (onlyWithData)', () => {
    it('di default mostra tutte le slice', () => {
      expect(component.onlyWithData()).toBe(false);
      expect(component.visibleSlices().map((s) => s.key)).toEqual(['coin', 'profile']);
    });

    it('toggleOnlyWithData lascia solo le slice con dati', () => {
      component.toggleOnlyWithData();
      expect(component.onlyWithData()).toBe(true);
      expect(component.visibleSlices().map((s) => s.key)).toEqual(['coin']);

      component.toggleOnlyWithData();
      expect(component.visibleSlices().map((s) => s.key)).toEqual(['coin', 'profile']);
    });
  });

  describe('albero IndexedDB', () => {
    it('toggleDb alterna l\'espansione del database', () => {
      expect(component.isDbExpanded('app')).toBe(false);
      component.toggleDb('app');
      expect(component.isDbExpanded('app')).toBe(true);
      component.toggleDb('app');
      expect(component.isDbExpanded('app')).toBe(false);
    });

    it('toggleStore espande e legge i record on-demand una sola volta', async () => {
      await component.toggleStore('app', 's1');
      expect(component.isStoreExpanded('app', 's1')).toBe(true);
      expect(idbProbe.readStoreEntries).toHaveBeenCalledWith('app', 's1', component.idbEntryLimit);
      expect(component.entriesFor('app', 's1')?.entries.length).toBe(1);
      expect(component.isStoreLoading('app', 's1')).toBe(false);

      // collassa e riespande: niente seconda lettura (cache)
      await component.toggleStore('app', 's1');
      expect(component.isStoreExpanded('app', 's1')).toBe(false);
      await component.toggleStore('app', 's1');
      expect(idbProbe.readStoreEntries).toHaveBeenCalledTimes(1);
    });

    it('toggleKey alterna la rivelazione del valore del record', () => {
      expect(component.isKeyExpanded('app', 's1', '1')).toBe(false);
      component.toggleKey('app', 's1', '1');
      expect(component.isKeyExpanded('app', 's1', '1')).toBe(true);
    });

    it('formatIdbValue serializza e maschera il valore', () => {
      expect(component.formatIdbValue({a: 1})).toContain('"a": 1');
      expect(component.formatIdbValue('utente@example.com')).toContain('«email-redatta»');
    });
  });
});
