import {dashboardRouteLiteral, resolveProjectName} from '../../schematics/dashboard/index';

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
