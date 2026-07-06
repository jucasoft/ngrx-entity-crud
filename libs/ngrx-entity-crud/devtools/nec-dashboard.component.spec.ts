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
  let localProbe: {read: jest.Mock; estimate: jest.Mock; readValue: jest.Mock};

  beforeEach(() => {
    storeProbe = {
      reset: jest.fn(),
      resetResponses: jest.fn(),
      read: jest.fn().mockReturnValue(report),
      readWithLazyReport: jest.fn().mockResolvedValue(report),
    };
    localProbe = {
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

  describe('contatori e quota (computed)', () => {
    it('withDataCount conta le slice con dati', () => {
      expect(component.withDataCount()).toBe(1);
    });

    it('quotaPercent arrotonda uso/quota e vale null se non stimabile', () => {
      component.quota.set({available: true, usage: 50, quota: 200});
      expect(component.quotaPercent()).toBe(25);

      component.quota.set({available: false});
      expect(component.quotaPercent()).toBeNull();

      component.quota.set({available: true, usage: 50, quota: 0});
      expect(component.quotaPercent()).toBeNull();
    });

    it('usageDetailEntries ordina il breakdown per uso decrescente', () => {
      component.quota.set({
        available: true,
        usage: 30,
        quota: 100,
        usageDetails: {caches: 10, indexedDB: 20},
      });
      expect(component.usageDetailEntries()).toEqual([
        {key: 'indexedDB', value: 20},
        {key: 'caches', value: 10},
      ]);
    });
  });

  describe('toolbar: pausa polling e report diagnostico', () => {
    it('togglePaused alterna la sospensione dell\'auto-refresh', () => {
      expect(component.paused()).toBe(false);
      component.togglePaused();
      expect(component.paused()).toBe(true);
      component.togglePaused();
      expect(component.paused()).toBe(false);
    });

    it('diagnosticReport serializza i soli metadati dei report correnti', () => {
      const parsed = JSON.parse(component.diagnosticReport());
      expect(parsed.store.slices.map((s: {key: string}) => s.key)).toEqual(['coin', 'profile']);
      expect(parsed.generatedAt).toEqual(expect.any(String));
      expect(parsed).toHaveProperty('quota');
      expect(parsed).toHaveProperty('localStorage');
      expect(parsed).toHaveProperty('indexedDb');
    });

    it('copyReport scrive negli appunti e attiva il feedback "Copiato"', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});

      await component.copyReport();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText.mock.calls[0][0]).toContain('"coin"');
      expect(component.copied()).toBe(true);
      component.ngOnDestroy(); // azzera il timer del feedback
    });
  });

  describe('snippet Python (pannello dedicato)', () => {
    beforeEach(() => {
      component.pythonSnippetKeys = ['access_token', 'refresh-token'];
      component.apiBaseUrl = 'https://api.example.com';
      localProbe.readValue.mockImplementation((k: string) => (k === 'access_token' ? 'tok"123' : null));
    });

    it('pythonVariablesBlock esporta le variabili con marcatori e valori escapati', () => {
      const block = component.pythonVariablesBlock();
      expect(block).toContain('# --- nec-dashboard: variables begin ---');
      expect(block).toContain('BASE_URL = "https://api.example.com"');
      expect(block).toContain('ACCESS_TOKEN = "tok\\"123"');
      expect(block).toContain('REFRESH_TOKEN = ""  # key "refresh-token" missing from localStorage');
      expect(block).toContain('# --- nec-dashboard: variables end ---');
    });

    it('pythonVariablesBlock(true) maschera i valori per l\'anteprima a schermo', () => {
      const preview = component.pythonVariablesBlock(true);
      expect(preview).not.toContain('tok\\"123');
      expect(preview).toContain('«hidden»'); // access_token è una chiave sensibile
      expect(preview).toContain('BASE_URL = "https://api.example.com"');
    });

    it('pythonSnippet accoda l\'esempio requests con il Bearer della prima chiave', () => {
      const code = component.pythonSnippet();
      expect(code).toContain('import requests');
      expect(code).toContain('f"Bearer {ACCESS_TOKEN}"');
      expect(code).toContain('f"{BASE_URL}/api/resource"');
    });

    it('copyPythonVariables copia solo il blocco variabili e attiva il feedback', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});

      await component.copyPythonVariables();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(writeText.mock.calls[0][0]).toContain('variables begin');
      expect(writeText.mock.calls[0][0]).not.toContain('import requests');
      // La copia mette negli appunti il valore IN CHIARO (solo l'anteprima è mascherata).
      expect(writeText.mock.calls[0][0]).toContain('tok\\"123');
      expect(component.copiedPython()).toBe('vars');
      component.ngOnDestroy(); // azzera il timer del feedback
    });
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
      expect(component.formatIdbValue('utente@example.com')).toContain('«redacted-email»');
    });
  });
});
