import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NecDashboardComponent} from './nec-dashboard.component';
import {NecLocalStorageProbeService} from './probes/nec-local-storage-probe.service';
import {NecIndexedDbProbeService} from './probes/nec-indexeddb-probe.service';
import {NecStoreProbeService} from './probes/nec-store-probe.service';
import {NecTableReportProbeService} from './probes/nec-table-report-probe.service';
import {NecGridRegistryService} from './nec-grid-registry.service';
import {NecLazyEntry, NecLiveGridEntry, NecStoreReport, NecTableReport} from './models';

describe('NecDashboardComponent (azioni di reset)', () => {
  const report: NecStoreReport = {
    slices: [
      {key: 'coin', kind: 'plural', isLoading: false, isLoaded: true, error: null, entityCount: 2, responsesCount: 1, hasData: true},
      {key: 'profile', kind: 'singular', isLoading: false, isLoaded: true, error: null, responsesCount: 0, hasData: false},
    ],
    loadingNames: [],
    errors: [],
    // verità dello stato root: include anche la slice non-CRUD `router`, assente da `slices`
    mountedKeys: ['coin', 'profile', 'router'],
    // conteggi NON filtrati: `product_browser` è montata ma esclusa dalla vista `slices`
    // (es. blacklist) — le correlazioni devono vederla comunque
    // eslint-disable-next-line camelcase -- le chiavi root reali sono underscore (convenzione Names.NAME)
    mountedEntityCounts: {coin: 2, product_browser: 5},
  };

  let fixture: ComponentFixture<NecDashboardComponent>;
  let component: NecDashboardComponent;
  let storeProbe: {reset: jest.Mock; resetResponses: jest.Mock; read: jest.Mock; readWithLazyReport: jest.Mock};
  let idbProbe: {read: jest.Mock; readStoreEntries: jest.Mock};
  let localProbe: {read: jest.Mock; estimate: jest.Mock; readValue: jest.Mock};
  let tableProbe: {read: jest.Mock};
  let gridRegistry: {read: jest.Mock; autoSizeColumns: jest.Mock; clearFilters: jest.Mock; clearSelection: jest.Mock};

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
    tableProbe = {
      read: jest.fn().mockResolvedValue(null),
    };
    gridRegistry = {
      read: jest.fn().mockReturnValue([]),
      autoSizeColumns: jest.fn().mockReturnValue(true),
      clearFilters: jest.fn().mockReturnValue(true),
      clearSelection: jest.fn().mockReturnValue(true),
    };

    TestBed.configureTestingModule({
      imports: [NecDashboardComponent],
      providers: [
        {provide: NecLocalStorageProbeService, useValue: localProbe},
        {provide: NecIndexedDbProbeService, useValue: idbProbe},
        {provide: NecStoreProbeService, useValue: storeProbe},
        {provide: NecTableReportProbeService, useValue: tableProbe},
        {provide: NecGridRegistryService, useValue: gridRegistry},
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
      expect(parsed).toHaveProperty('tables');
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

  describe('pannello Tables (inventario da table-report)', () => {
    const tables: NecTableReport = {
      generatedAt: '2026-07-10T10:00:00.000Z',
      summary: {grids: 3, agGrid: 2, pTable: 1, orphans: 1, agGridEnterprise: true},
      grids: [
        {
          component: 'CoinListComponent', selector: 'app-coin-list', file: 'src/app/x.ts',
          kind: 'ag-grid', where: 'views/coin', section: 'coin', inlineTemplate: false,
          stores: ['coin'], mountedStores: ['coin'], columnsCount: 4, columnsDynamicEntries: 1,
          columnsSource: 'class-property', colDefType: 'CustomColDef',
          columnFields: ['id', 'name'], isOrphan: false, verdict: 'ok', runtimeStatus: 'loaded',
        },
        {
          component: 'LogListComponent', selector: 'app-log-list', file: 'src/app/y.ts',
          kind: 'ag-grid', where: 'core/log', section: null, inlineTemplate: true,
          stores: [], mountedStores: [], columnsCount: 6, columnsDynamicEntries: 0,
          columnsSource: 'assignment', colDefType: null,
          columnFields: [], isOrphan: true, verdict: 'orphan?', runtimeStatus: 'no-store',
        },
        {
          component: 'DogListComponent', selector: 'app-dog-list', file: 'src/app/z.ts',
          kind: 'p-table', where: 'views/dog', section: 'dog', inlineTemplate: false,
          stores: ['dog'], mountedStores: [], columnsCount: 0, columnsDynamicEntries: 0,
          columnsSource: 'runtime-keys', colDefType: null,
          columnFields: [], isOrphan: false, verdict: 'ok (runtime columns)', runtimeStatus: 'not-loaded',
        },
      ],
    };

    it('i contatori derivano dalle griglie caricate', () => {
      component.tableReport.set(tables);
      expect(component.agGridCount()).toBe(2);
      expect(component.pTableCount()).toBe(1);
      expect(component.orphanGridsCount()).toBe(1);
    });

    it('i contatori valgono 0 senza report', () => {
      component.tableReport.set(null);
      expect(component.agGridCount()).toBe(0);
      expect(component.pTableCount()).toBe(0);
      expect(component.orphanGridsCount()).toBe(0);
    });

    it('gridRuntimeTitle spiega i partial (store non montati o non-CRUD)', () => {
      expect(component.gridRuntimeTitle(tables.grids[0])).toBe('mounted: coin');
      expect(component.gridRuntimeTitle(tables.grids[1])).toBe('the grid component references no store');
      expect(component.gridRuntimeTitle(tables.grids[2])).toBe('not mounted: dog');
      expect(component.gridRuntimeTitle({stores: ['a', 'b'], mountedStores: ['a']})).toBe(
        'mounted: a — not mounted: b'
      );
    });

    it('formatGridColumns distingue statiche, dinamiche e runtime', () => {
      expect(component.formatGridColumns(tables.grids[0])).toBe('4 (+1 dynamic)');
      expect(component.formatGridColumns(tables.grids[1])).toBe('6');
      expect(component.formatGridColumns(tables.grids[2])).toBe('runtime');
      expect(
        component.formatGridColumns({kind: 'p-table', columnsCount: 0, columnsDynamicEntries: 0, columnsSource: null})
      ).toBe('–');
    });

    it('refresh interroga il probe con le chiavi root NON filtrate (mountedKeys) e salva il report', async () => {
      (component.refresh as jest.Mock).mockRestore();
      tableProbe.read.mockResolvedValue(tables);

      await component.refresh();

      // mountedKeys include anche `router` (slice non-CRUD, esclusa dalla vista `slices`)
      expect(tableProbe.read).toHaveBeenCalledWith('assets/table-report.json', ['coin', 'profile', 'router']);
      expect(component.tableReport()).toEqual(tables);
    });

    it('senza mountedKeys (report costruito a mano) ripiega sulle chiavi delle slice', async () => {
      (component.refresh as jest.Mock).mockRestore();
      const legacy: NecStoreReport = {...report};
      delete legacy.mountedKeys;
      storeProbe.readWithLazyReport.mockResolvedValue(legacy);
      tableProbe.read.mockResolvedValue(tables);

      await component.refresh();

      expect(tableProbe.read).toHaveBeenCalledWith('assets/table-report.json', ['coin', 'profile']);
    });

    it('refresh sovrascrive con null un report precedente quando il probe non trova più il file', async () => {
      (component.refresh as jest.Mock).mockRestore();
      component.tableReport.set(tables); // report "buono" da un refresh precedente
      tableProbe.read.mockResolvedValue(null); // es. 404 dopo un deploy senza table-report.json

      await component.refresh();

      // niente snapshot stantio: il pannello torna all'empty state col comando di rigenerazione
      expect(tableProbe.read).toHaveBeenCalled();
      expect(component.tableReport()).toBeNull();
    });

    it('con tableReportUrl vuoto il probe non viene interrogato e il report resta null', async () => {
      (component.refresh as jest.Mock).mockRestore();
      component.tableReportUrl = '';
      component.tableReport.set(tables);

      await component.refresh();

      expect(tableProbe.read).not.toHaveBeenCalled();
      expect(component.tableReport()).toBeNull();
    });
  });

  describe('pannello Live grids (registry runtime opt-in)', () => {
    const grid: NecLiveGridEntry = {
      id: 7,
      key: 'coin-list',
      store: 'coin',
      component: 'CoinListComponent',
      displayedRows: 1,
      selectedCount: 0,
      filterCount: 1,
      sortedColumns: ['name asc'],
      registeredAt: '2026-07-13T10:00:00.000Z',
    };

    it('refresh legge lo snapshot del registry e lo salva in liveGrids', async () => {
      (component.refresh as jest.Mock).mockRestore();
      gridRegistry.read.mockReturnValue([grid]);

      await component.refresh();

      expect(component.liveGrids()).toEqual([grid]);
      expect(JSON.parse(component.diagnosticReport()).liveGrids.length).toBe(1);
    });

    it('liveGridEntityCount usa i conteggi NON filtrati (mountedEntityCounts)', () => {
      expect(component.liveGridEntityCount(grid)).toBe(2); // coin
      // slice montata ma esclusa dalla vista `slices` (blacklist): il conteggio c'è comunque
      expect(component.liveGridEntityCount({...grid, store: 'product_browser'})).toBe(5);
      // tolleranza per il nome dasherizzato, come le correlazioni dei report statici
      expect(component.liveGridEntityCount({...grid, store: 'product-browser'})).toBe(5);
      expect(component.liveGridEntityCount({...grid, store: null})).toBeNull();
      expect(component.liveGridEntityCount({...grid, store: 'not-mounted'})).toBeNull();
      // slice singular senza entityCount -> null, non 0
      expect(component.liveGridEntityCount({...grid, store: 'profile'})).toBeNull();
    });

    it('report legacy senza mountedEntityCounts: fallback sulla vista slices', () => {
      const legacy: NecStoreReport = {...report};
      delete legacy.mountedEntityCounts;
      component.storeReport.set(legacy);
      expect(component.liveGridEntityCount(grid)).toBe(2); // slice `coin` del fixture
    });

    it('le azioni rileggono SOLO lo snapshot del registry, senza refresh completo', () => {
      gridRegistry.read.mockReturnValue([grid]);

      component.clearLiveGridFilters(grid);
      expect(gridRegistry.clearFilters).toHaveBeenCalledWith(7);

      component.clearLiveGridSelection(grid);
      expect(gridRegistry.clearSelection).toHaveBeenCalledWith(7);

      component.autoSizeLiveGrid(grid);
      expect(gridRegistry.autoSizeColumns).toHaveBeenCalledWith(7);

      // il click su un'azione non deve costare fetch/IndexedDB né azzerare lo stato UI
      expect(component.refresh).not.toHaveBeenCalled();
      expect(gridRegistry.read).toHaveBeenCalledTimes(3); // eviction/conteggi aggiornati
      expect(component.liveGrids()).toEqual([grid]);
    });
  });

  describe('pannello Lazy sections (comando di promozione)', () => {
    const candidate: NecLazyEntry = {
      name: 'coin-store',
      clazz: 'Coin',
      type: 'CRUD-PLURAL',
      verdict: 'lazy candidate',
      isLazyCandidate: true,
      lazyRoute: true,
      sections: ['coin'],
      usedByShell: false,
      runtimeStatus: 'lazy-not-loaded',
    };

    it('lazyStoreCommand replica il comando del report Markdown', () => {
      expect(component.lazyStoreCommand(candidate)).toBe(
        'ng generate ngrx-entity-crud:store --clazz=Coin --type=CRUD-PLURAL --registration=lazy'
      );
    });

    it('lazyStoreCommand preserva il tipo CRUD-SINGULAR', () => {
      expect(component.lazyStoreCommand({...candidate, type: 'CRUD-SINGULAR'})).toContain(
        '--type=CRUD-SINGULAR'
      );
    });

    it('report legacy: clazz riderivato dal nome cartella e type unknown -> CRUD-PLURAL', () => {
      const legacy: NecLazyEntry = {
        ...candidate,
        name: 'product-browser-store',
        clazz: undefined,
        type: 'unknown',
      };
      expect(component.lazyStoreCommand(legacy)).toBe(
        'ng generate ngrx-entity-crud:store --clazz=ProductBrowser --type=CRUD-PLURAL --registration=lazy'
      );
    });

    it('lazyCandidatesCount conta solo le entry promovibili', () => {
      component.storeReport.set({
        ...report,
        lazy: [candidate, {...candidate, name: 'log-store', isLazyCandidate: false}],
      });
      expect(component.lazyCandidatesCount()).toBe(1);

      component.storeReport.set(report); // report senza sezione lazy
      expect(component.lazyCandidatesCount()).toBe(0);
    });

    it('copyLazyCommand copia il comando e attiva il feedback sulla riga', async () => {
      const writeText = jest.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {value: {writeText}, configurable: true});

      await component.copyLazyCommand(candidate);

      expect(writeText).toHaveBeenCalledWith(
        'ng generate ngrx-entity-crud:store --clazz=Coin --type=CRUD-PLURAL --registration=lazy'
      );
      expect(component.copiedLazy()).toBe('coin-store');
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
