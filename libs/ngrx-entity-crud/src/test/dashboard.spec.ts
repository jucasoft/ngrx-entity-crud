import {
  dashboardRouteLiteral,
  lazyReportComposition,
  reportAssetUrl,
  resolveProjectName,
  scaffoldEnabled,
  tableReportComposition,
} from '../../schematics/dashboard/index';

/**
 * Test della logica pura dello schematic `dashboard`. Il render dei template richiede l'engine
 * di Angular schematics (non testabile invocando la Rule a mano), ma la parte di business a
 * rischio — risoluzione del progetto (incluso il fix del bug `defaultProject`) e costruzione
 * della rotta lazy — è isolata in funzioni pure verificabili qui.
 */
describe('dashboard schematic — resolveProjectName', () => {
  it('usa il project esplicito quando fornito', () => {
    const ws = {projects: {app1: {}, app2: {}}};
    expect(resolveProjectName(ws, 'app2')).toBe('app2');
  });

  it('fallback a defaultProject (legacy) quando presente', () => {
    const ws = {defaultProject: 'legacy', projects: {legacy: {}, other: {}}};
    expect(resolveProjectName(ws)).toBe('legacy');
  });

  it('fallback al primo progetto se manca defaultProject (Angular 15+)', () => {
    const ws = {projects: {firstApp: {}, second: {}}};
    expect(resolveProjectName(ws)).toBe('firstApp');
  });

  it('lancia se nessun progetto è risolvibile', () => {
    expect(() => resolveProjectName({projects: {}})).toThrow(/progetto/i);
  });

  it('lancia se il project esplicito non esiste nel workspace', () => {
    expect(() => resolveProjectName({projects: {a: {}}}, 'inesistente')).toThrow();
  });
});

describe('dashboard schematic — dashboardRouteLiteral', () => {
  it('costruisce la rotta lazy verso il modulo generato', () => {
    expect(dashboardRouteLiteral('Dashboard')).toBe(
      '{path: \'dashboard\', loadChildren: () => import(\'./main/views/dashboard/dashboard.module\').then(m => m.DashboardModule)}'
    );
  });

  it('dasherizza il path ma mantiene il nome classe nel simbolo del modulo', () => {
    const literal = dashboardRouteLiteral('AdminPanel');
    expect(literal).toContain('path: \'admin-panel\'');
    expect(literal).toContain('views/admin-panel/admin-panel.module');
    expect(literal).toContain('m.AdminPanelModule');
  });
});

/**
 * Le composizioni sono il contratto cross-subsystem schematic -> asset generato -> probe
 * runtime: `format: 'json'` e i path di default DEVONO combaciare con gli URL letti da
 * `<nec-dashboard>` (default `assets/lazy-report.json` / `assets/table-report.json`).
 */
describe('dashboard schematic — composizione dei report', () => {
  it('di default compone il table-report in JSON su src/assets/table-report.json', () => {
    expect(tableReportComposition({})).toEqual({
      output: 'src/assets/table-report.json',
      format: 'json',
    });
  });

  it('rispetta tableReportOutput custom mantenendo il formato JSON', () => {
    expect(tableReportComposition({tableReportOutput: 'src/assets/reports/tables.json'})).toEqual({
      output: 'src/assets/reports/tables.json',
      format: 'json',
    });
  });

  it('con includeTableReport=false non compone nulla', () => {
    expect(tableReportComposition({includeTableReport: false})).toBeNull();
  });

  it('di default compone il lazy-report in JSON su src/assets/lazy-report.json', () => {
    expect(lazyReportComposition({})).toEqual({
      output: 'src/assets/lazy-report.json',
      format: 'json',
    });
  });

  it('con includeLazyReport=false non compone nulla', () => {
    expect(lazyReportComposition({includeLazyReport: false})).toBeNull();
  });

  it('scaffoldEnabled: true di default e con true esplicito, false solo su opt-out', () => {
    // Il default deve valere anche SENZA i default dello schema (opzioni passate a mano),
    // perché il valore viene calcolato in index.ts e passato esplicito al template.
    expect(scaffoldEnabled({})).toBe(true);
    expect(scaffoldEnabled({includeScaffold: true})).toBe(true);
    expect(scaffoldEnabled({includeScaffold: false})).toBe(false);
  });

  it('reportAssetUrl deriva l\'URL runtime dal path di output (strip di src/)', () => {
    expect(reportAssetUrl(tableReportComposition({}))).toBe('assets/table-report.json');
    expect(reportAssetUrl(lazyReportComposition({}))).toBe('assets/lazy-report.json');
    expect(reportAssetUrl(tableReportComposition({tableReportOutput: 'src/assets/reports/t.json'}))).toBe(
      'assets/reports/t.json'
    );
    // report disattivato -> stringa vuota: per il componente '' nasconde/disattiva il pannello
    expect(reportAssetUrl(null)).toBe('');
  });
});
