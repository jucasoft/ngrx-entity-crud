import {TestBed} from '@angular/core/testing';
import {NecTableReportProbeService} from './nec-table-report-probe.service';
import {NecTableReport} from '../models';

describe('NecTableReportProbeService', () => {
  let service: NecTableReportProbeService;
  const originalFetch = global.fetch;

  /** Report d'esempio nel formato emesso da `table-report --format=json`. */
  const reportJson = {
    generatedAt: '2026-07-10T10:00:00.000Z',
    summary: {grids: 3, agGrid: 2, pTable: 1, orphans: 1, agGridEnterprise: true},
    grids: [
      {
        component: 'ProductBrowserListComponent',
        selector: 'app-product-browser-list',
        file: 'src/app/main/views/product-browser/product-browser-list/product-browser-list.component.ts',
        kind: 'ag-grid',
        where: 'views/product-browser',
        section: 'product-browser',
        inlineTemplate: false,
        stores: ['product-browser', 'router'],
        columnsCount: 2,
        columnsDynamicEntries: 0,
        columnsSource: 'class-property',
        colDefType: 'CustomColDef',
        columns: [{field: 'id', headerName: null, props: ['field']}, {field: 'name', headerName: 'Name', props: ['field', 'headerName']}],
        isOrphan: false,
        verdict: 'ok',
      },
      {
        component: 'LogListComponent',
        kind: 'ag-grid',
        where: 'core/components/log',
        stores: ['update-log'],
        columnsCount: 6,
        isOrphan: true,
        verdict: 'orphan? (not referenced by any used template/module)',
      },
      {
        component: 'DogListComponent',
        kind: 'p-table',
        where: 'views/dog',
        stores: [],
        columnsCount: 0,
        columnsSource: 'runtime-keys',
        isOrphan: false,
        verdict: 'ok (runtime columns)',
      },
    ],
  };

  function mockFetch(body: unknown, ok = true): jest.Mock {
    const fn = jest.fn().mockResolvedValue({ok, json: () => Promise.resolve(body)});
    (global as any).fetch = fn;
    return fn;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NecTableReportProbeService);
  });

  afterEach(() => {
    (global as any).fetch = originalFetch;
  });

  /** Come `service.read`, ma fallisce il test se il report è null (narrowing senza `!`). */
  async function readOrFail(url: string, mounted: string[]): Promise<NecTableReport> {
    const report = await service.read(url, mounted);
    expect(report).not.toBeNull();
    return report as NecTableReport;
  }

  it('normalizza il report e correla il runtimeStatus con le chiavi root montate', async () => {
    const fetchMock = mockFetch(reportJson);
    // Chiavi root reali (mountedKeys): product_browser (CRUD, underscore) e router (non-CRUD,
    // registrata da forFeature('router')); update_log assente.
    const report = await readOrFail('assets/table-report.json', ['product_browser', 'router']);

    expect(fetchMock).toHaveBeenCalledWith('assets/table-report.json', {
      headers: {Accept: 'application/json'},
    });
    expect(report.generatedAt).toBe('2026-07-10T10:00:00.000Z');
    expect(report.summary).toEqual({grids: 3, agGrid: 2, pTable: 1, orphans: 1, agGridEnterprise: true});
    expect(report.grids.length).toBe(3);

    const product = report.grids[0];
    expect(product.component).toBe('ProductBrowserListComponent');
    expect(product.columnFields).toEqual(['id', 'name']);
    expect(product.columnsCount).toBe(2);
    expect(product.colDefType).toBe('CustomColDef');
    expect(product.runtimeStatus).toBe('loaded'); // tutte le sue slice sono montate
    expect(product.mountedStores).toEqual(['product-browser', 'router']);

    const log = report.grids[1];
    expect(log.isOrphan).toBe(true);
    expect(log.runtimeStatus).toBe('not-loaded'); // update-log non montata

    const dog = report.grids[2];
    expect(dog.runtimeStatus).toBe('no-store'); // nessuno store referenziato
    expect(dog.columnFields).toEqual([]);
  });

  it('runtimeStatus partial quando solo alcune slice della griglia sono montate', async () => {
    mockFetch(reportJson);
    const report = await readOrFail('r.json', ['router']); // solo router montata

    expect(report.grids[0].runtimeStatus).toBe('partial');
    expect(report.grids[0].mountedStores).toEqual(['router']);
  });

  it('tollera griglie con campi mancanti (report minimale o versioni future)', async () => {
    mockFetch({grids: [{}]});
    const report = await readOrFail('r.json', []);

    expect(report.grids.length).toBe(1);
    const g = report.grids[0];
    expect(g.component).toBe('(unknown)');
    expect(g.kind).toBe('unknown');
    expect(g.stores).toEqual([]);
    expect(g.columnsCount).toBe(0);
    expect(g.isOrphan).toBe(false);
    expect(g.runtimeStatus).toBe('no-store');
    expect(report.summary).toBeUndefined();
  });

  it('ritorna null su risposta non ok, JSON malformato o senza grids', async () => {
    mockFetch(reportJson, false);
    expect(await service.read('r.json', [])).toBeNull();

    mockFetch({stores: []}); // shape del lazy-report, non del table-report
    expect(await service.read('r.json', [])).toBeNull();

    (global as any).fetch = jest.fn().mockRejectedValue(new Error('network'));
    expect(await service.read('r.json', [])).toBeNull();
  });

  it('ritorna null quando fetch non è disponibile (SSR)', async () => {
    (global as any).fetch = undefined;
    expect(await service.read('r.json', [])).toBeNull();
  });
});
