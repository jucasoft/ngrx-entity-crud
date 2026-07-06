import {HostTree, Tree} from '@angular-devkit/schematics';
import {lazyReport} from '../../schematics/lazy-report/index';

/**
 * Test d'integrazione dello schematic `lazy-report` eseguito direttamente sulla Rule con un
 * `HostTree` in-memory (niente SchematicTestRunner/collection): verifica le aggiunte non-breaking
 * della Fase 1 (campi strutturati `lazyRoute`/`isLazyCandidate`, `generatedAt`, `storage`).
 */
describe('lazy-report schematic (Rule)', () => {
  function buildTree(): Tree {
    const tree = new HostTree();
    tree.create(
      '/package.json',
      JSON.stringify({dependencies: {'ngrx-store-idb': '^1.0.0', '@angular/core': '^19.0.0'}})
    );
    // store CRUD plural usato da una sezione su rotta lazy -> candidato lazy
    tree.create(
      '/src/app/root-store/coin-store/coin.state.ts',
      'import {createEntityAdapter} from "@ngrx/entity"; export const x = createEntityAdapter();'
    );
    tree.create(
      '/src/app/main/views/coins/coins.component.ts',
      'import {CoinStoreActions} from "x"; CoinStoreActions;'
    );
    // store singular usato dallo shell -> resta eager
    tree.create(
      '/src/app/root-store/auth-store/auth.state.ts',
      'export const y = "EntitySingleCrudState";'
    );
    tree.create('/src/app/main/views/profile/profile.component.ts', 'AuthStoreSelectors;');
    tree.create('/src/app/core/auth.guard.ts', 'AuthStoreService;');
    // routing: coins lazy, profile no
    tree.create(
      '/src/app/app-routing.module.ts',
      'const routes = [{ path: "coins", loadChildren: () => import("./main/views/coins/coins.module") }];'
    );
    return tree;
  }

  function run(tree: Tree, options: any): void {
    const context = {logger: {info: (): void => undefined}} as any;
    lazyReport(options)(tree, context);
  }

  function readJson(tree: Tree, path: string): any {
    const raw = tree.read(path);
    expect(raw).not.toBeNull();
    return JSON.parse((raw || Buffer.from('{}')).toString());
  }

  it('emette un JSON con generatedAt, campi strutturati e storage', () => {
    const tree = buildTree();
    run(tree, {output: 'lazy-report.json', format: 'json'});
    const json = readJson(tree, '/lazy-report.json');

    expect(typeof json.generatedAt).toBe('string');
    expect(json.generatedAt.length).toBeGreaterThan(0);
    expect(json.storage.providers).toContain('ngrx-store-idb');

    const coin = json.stores.find((s: any) => s.name === 'coin-store');
    expect(coin.type).toBe('CRUD-PLURAL');
    expect(coin.verdict).toBe('lazy candidate');
    expect(coin.isLazyCandidate).toBe(true);
    expect(coin.lazyRoute).toBe(true);

    const auth = json.stores.find((s: any) => s.name === 'auth-store');
    expect(auth.usedByShell).toBe(true);
    expect(auth.isLazyCandidate).toBe(false);
    expect(auth.lazyRoute).toBe(false);
  });

  it('senza output il default segue il formato: format=json scrive lazy-report.json', () => {
    const tree = buildTree();
    run(tree, {format: 'json'});
    expect(tree.exists('/lazy-report.md')).toBe(false);
    const json = readJson(tree, '/lazy-report.json');
    expect(Array.isArray(json.stores)).toBe(true);
  });

  it('senza output ne formato scrive il markdown di default lazy-report.md', () => {
    const tree = buildTree();
    run(tree, {});
    expect(tree.exists('/lazy-report.json')).toBe(false);
    const raw = tree.read('/lazy-report.md');
    expect(raw).not.toBeNull();
    expect((raw || Buffer.from('')).toString()).toContain('# Lazy store report');
  });

  it('con storage:false omette il campo storage (resta non-breaking)', () => {
    const tree = buildTree();
    run(tree, {output: 'r.json', format: 'json', storage: false});
    const json = readJson(tree, '/r.json');
    expect(json.storage).toBeUndefined();
    expect(typeof json.generatedAt).toBe('string');
    // i campi store fondamentali restano presenti
    expect(Array.isArray(json.stores)).toBe(true);
    expect(json.stores[0]).toHaveProperty('verdict');
  });
});
