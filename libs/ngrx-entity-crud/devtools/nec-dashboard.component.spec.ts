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

  describe('albero IndexedDB (p-tree lazy)', () => {
    it('onNodeExpand su un nodo store legge i record e popola i figli', async () => {
      const node: any = {type: 'store', data: {db: 'app', store: 's1', count: 1}, children: []};
      await component.onNodeExpand({node});

      expect(idbProbe.readStoreEntries).toHaveBeenCalledWith('app', 's1', component.idbEntryLimit);
      expect(node.children.length).toBe(1);
      expect(node.children[0].label).toBe('1');
      expect(component.idbLoading()).toBe(false);
    });

    it('onNodeExpand ignora i nodi database (nessuna lettura)', async () => {
      const node: any = {data: {db: 'app'}, children: []};
      await component.onNodeExpand({node});
      expect(idbProbe.readStoreEntries).not.toHaveBeenCalled();
    });

    it('onNodeExpand non rilegge un nodo store già caricato', async () => {
      const node: any = {type: 'store', data: {db: 'app', store: 's1'}, children: [{label: 'x'}]};
      await component.onNodeExpand({node});
      expect(idbProbe.readStoreEntries).not.toHaveBeenCalled();
    });

    it('con allowRevealValues il record ha un nodo figlio col valore mascherato', async () => {
      component.allowRevealValues = true;
      const node: any = {type: 'store', data: {db: 'app', store: 's1'}, children: []};
      await component.onNodeExpand({node});

      const record = node.children[0];
      expect(record.leaf).toBe(false);
      expect(record.children[0].type).toBe('value');
      expect(record.children[0].label).toContain('"a": 1');
    });

    it('formatIdbValue serializza e maschera il valore', () => {
      expect(component.formatIdbValue({a: 1})).toContain('"a": 1');
      expect(component.formatIdbValue('utente@example.com')).toContain('«email-redatta»');
    });
  });
});
