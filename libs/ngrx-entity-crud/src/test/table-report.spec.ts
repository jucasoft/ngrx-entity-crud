import {HostTree, Tree} from '@angular-devkit/schematics';
import {tableReport} from '../../schematics/table-report/index';

/**
 * Test d'integrazione dello schematic `table-report` eseguito direttamente sulla Rule con un
 * `HostTree` in-memory. Il finto consumer replica i casi reali del testbed:
 * - griglia ag-Grid con template esterno e `columnDefs: CustomColDef[]` (con entry spread);
 * - griglia ag-Grid standalone con template inline in core/, referenziata da un altro .ts;
 * - griglia ag-Grid orfana (dichiarata da un modulo mai importato; l'unico uso e' commentato);
 * - lista p-table con colonne calcolate a runtime (Object.keys), convenzione dello schematic section.
 */
describe('table-report schematic (Rule)', () => {
  function buildTree(): Tree {
    const tree = new HostTree();
    tree.create(
      '/package.json',
      JSON.stringify({
        dependencies: {
          '@ag-grid-community/core': '31.1.1',
          '@ag-grid-community/angular': '31.1.1',
          '@ag-grid-enterprise/menu': '31.1.1',
          primeng: '^16.9.1',
          '@angular/core': '^16.2.0',
        },
      })
    );
    // store noti per la correlazione griglia -> slice
    tree.create('/src/app/root-store/coin-store/coin.state.ts', 'export const s = {};');
    tree.create('/src/app/root-store/dog-store/dog.state.ts', 'export const s = {};');

    // routing: i moduli delle sezioni coin e dog sono usati (loadChildren); LogModule no
    tree.create(
      '/src/app/app-routing.module.ts',
      'const routes = [' +
        '{path: "coin", loadChildren: () => import("./main/views/coin/coin.module").then(m => m.CoinModule)},' +
        '{path: "dog", loadChildren: () => import("./main/views/dog/dog.module").then(m => m.DogModule)}];'
    );

    // 1) sezione "coin": griglia ag-Grid con template esterno, CustomColDef, spread dinamico
    tree.create(
      '/src/app/main/views/coin/coin-list/coin-list.component.ts',
      `
import {Component} from '@angular/core';
import {CustomColDef} from '@models/api/custom-col-def';
import {CoinStoreActions} from '@root-store';

const extraColumns: CustomColDef[] = [];

@Component({
  selector: 'app-coin-list',
  templateUrl: './coin-list.component.html',
})
export class CoinListComponent {
  actions = CoinStoreActions;
  defaultColDef = {sortable: true, filter: true, resizable: true};
  gridOptions = {masterDetail: true, context: {}};
  columnDefs: CustomColDef[] = [
    {field: 'id', sortable: true, filter: true},
    {field: 'name', headerName: 'Name', suppressExport: true},
    ...extraColumns,
  ];
}
`
    );
    tree.create(
      '/src/app/main/views/coin/coin-list/coin-list.component.html',
      '<ag-grid-angular class="ag-theme-balham" [rowData]="collection" [columnDefs]="columnDefs"' +
        ' (gridReady)="onGridReady($event)" groupDisplayType="multipleColumns"></ag-grid-angular>'
    );
    tree.create(
      '/src/app/main/views/coin/coin-main/coin-main.component.html',
      '<app-coin-list [collection]="collection$ | async"></app-coin-list>'
    );
    tree.create(
      '/src/app/main/views/coin/coin.module.ts',
      'import {CoinListComponent} from "./coin-list/coin-list.component"; export class CoinModule {}'
    );
    // riferimento COMMENTATO alla griglia orfana: non deve contare come uso
    tree.create(
      '/src/app/main/views/coin/coin-edit/coin-edit.component.html',
      '<div><!-- <app-log-list [collection]="logs"></app-log-list> --></div>'
    );

    // 2) griglia standalone con template inline in core/, referenziata da un altro componente
    tree.create(
      '/src/app/core/components/diff/diff.component.ts',
      `
import {Component} from '@angular/core';

@Component({
  selector: 'app-diff',
  standalone: true,
  template: '<ag-grid-angular class="ag-theme-balham" [columnDefs]="columnDefs"></ag-grid-angular>',
})
export class DiffComponent {
  columnDefs = [{headerName: 'Object', field: 'object'}];
}
`
    );
    tree.create(
      '/src/app/core/components/common-edit.component.ts',
      'import {DiffComponent} from "./diff/diff.component"; export const uses = DiffComponent;'
    );

    // 3) griglia orfana: colonne assegnate nel costruttore, dichiarata da un modulo mai importato
    tree.create(
      '/src/app/core/components/log/log-list.component.ts',
      `
import {Component} from '@angular/core';

@Component({
  selector: 'app-log-list',
  template: '<ag-grid-angular [columnDefs]="columnDefs"></ag-grid-angular>',
})
export class LogListComponent {
  columnDefs: any[];
  constructor() {
    this.columnDefs = [{field: 'when'}, {field: 'who'}];
  }
}
`
    );
    tree.create(
      '/src/app/core/components/log/log.module.ts',
      'import {LogListComponent} from "./log-list.component"; export class LogModule {}'
    );

    // 4) sezione "dog": lista p-table con colonne runtime (convenzione schematic section)
    tree.create(
      '/src/app/main/views/dog/dog-list/dog-list.component.ts',
      `
import {Component} from '@angular/core';
import {DogStoreSelectors} from '@root-store';

@Component({
  selector: 'app-dog-list',
  templateUrl: './dog-list.component.html',
})
export class DogListComponent {
  cols: string[] = [];
  selectors = DogStoreSelectors;
  ngOnInit(): void {
    this.cols = Object.keys({a: 1});
  }
}
`
    );
    tree.create(
      '/src/app/main/views/dog/dog-list/dog-list.component.html',
      '<p-table [value]="collection$ | async"></p-table>'
    );
    tree.create(
      '/src/app/main/views/dog/dog-main/dog-main.component.html',
      '<app-dog-list></app-dog-list>'
    );
    tree.create(
      '/src/app/main/views/dog/dog.module.ts',
      'import {DogListComponent} from "./dog-list/dog-list.component"; export class DogModule {}'
    );
    return tree;
  }

  function run(tree: Tree, options: any): void {
    const context = {logger: {info: (): void => undefined}} as any;
    tableReport(options)(tree, context);
  }

  function readJson(tree: Tree, path: string): any {
    const raw = tree.read(path);
    expect(raw).not.toBeNull();
    return JSON.parse((raw || Buffer.from('{}')).toString());
  }

  it('inventaria le griglie con colonne AST, correlazione store e pacchetti', () => {
    const tree = buildTree();
    run(tree, {output: 'table-report.json', format: 'json'});
    const json = readJson(tree, '/table-report.json');

    expect(typeof json.generatedAt).toBe('string');
    expect(json.summary.grids).toBe(4);
    expect(json.summary.agGrid).toBe(3);
    expect(json.summary.pTable).toBe(1);
    expect(json.summary.orphans).toBe(1);
    expect(json.summary.agGridEnterprise).toBe(true);
    expect(json.packages.map((p: any) => p.name)).toContain('@ag-grid-community/core');
    expect(json.packages.map((p: any) => p.name)).toContain('primeng');

    const coin = json.grids.find((g: any) => g.component === 'CoinListComponent');
    expect(coin.kind).toBe('ag-grid');
    expect(coin.section).toBe('coin');
    expect(coin.area).toBe('views');
    expect(coin.inlineTemplate).toBe(false);
    expect(coin.templateFile).toBe('src/app/main/views/coin/coin-list/coin-list.component.html');
    expect(coin.stores).toEqual(['coin']);
    expect(coin.theme).toBe('ag-theme-balham');
    expect(coin.colDefType).toBe('CustomColDef');
    expect(coin.columnsSource).toBe('class-property');
    expect(coin.columnsCount).toBe(2);
    expect(coin.columnsDynamicEntries).toBe(1);
    expect(coin.columns[0]).toEqual({field: 'id', headerName: null, props: ['field', 'sortable', 'filter']});
    expect(coin.columns[1].headerName).toBe('Name');
    expect(coin.columns[1].props).toContain('suppressExport');
    expect(coin.defaultColDefProps).toEqual(['sortable', 'filter', 'resizable']);
    expect(coin.gridOptionsProps).toEqual(['masterDetail', 'context']);
    expect(coin.bindings).toContain('columnDefs');
    expect(coin.bindings).toContain('gridReady');
    // referenziata solo internamente alla sezione, ma CoinModule e' usato da app-routing
    expect(coin.referenced).toBe(true);
    expect(coin.isOrphan).toBe(false);
    expect(coin.referencedBy).toContain('src/app/app-routing.module.ts');
    expect(coin.where).toBe('views/coin');
  });

  it('rileva template inline, assegnazioni nel costruttore e griglie orfane', () => {
    const tree = buildTree();
    run(tree, {output: 'r.json', format: 'json'});
    const json = readJson(tree, '/r.json');

    const diff = json.grids.find((g: any) => g.component === 'DiffComponent');
    expect(diff.inlineTemplate).toBe(true);
    expect(diff.standalone).toBe(true);
    expect(diff.area).toBe('core');
    expect(diff.columnsSource).toBe('class-property');
    expect(diff.columns[0]).toEqual({field: 'object', headerName: 'Object', props: ['headerName', 'field']});
    expect(diff.referenced).toBe(true);

    // orfana: l'unico riferimento non-modulo e' commentato, e LogModule non e' importato da nessuno
    const log = json.grids.find((g: any) => g.component === 'LogListComponent');
    expect(log.columnsSource).toBe('assignment');
    expect(log.columnsCount).toBe(2);
    expect(log.columns[0].field).toBe('when');
    expect(log.referenced).toBe(false);
    expect(log.isOrphan).toBe(true);
    expect(log.verdict).toContain('orphan');
  });

  it('classifica le p-table con colonne runtime (convenzione section)', () => {
    const tree = buildTree();
    run(tree, {output: 'r.json', format: 'json'});
    const json = readJson(tree, '/r.json');

    const dog = json.grids.find((g: any) => g.component === 'DogListComponent');
    expect(dog.kind).toBe('p-table');
    expect(dog.section).toBe('dog');
    expect(dog.stores).toEqual(['dog']);
    expect(dog.columnsSource).toBe('runtime-keys');
    expect(dog.referenced).toBe(true);
    expect(dog.verdict).toBe('ok (runtime columns)');
  });

  it('senza output il default segue il formato; il markdown contiene il titolo', () => {
    const tree = buildTree();
    run(tree, {});
    expect(tree.exists('/table-report.json')).toBe(false);
    const raw = tree.read('/table-report.md');
    expect(raw).not.toBeNull();
    const md = (raw || Buffer.from('')).toString();
    expect(md).toContain('# Table report');
    expect(md).toContain('CoinListComponent');
    expect(md).toContain('## Column details');
  });

  it('con columns=false omette il dettaglio colonne ma mantiene i conteggi', () => {
    const tree = buildTree();
    run(tree, {output: 'r.json', format: 'json', columns: false});
    const json = readJson(tree, '/r.json');
    const coin = json.grids.find((g: any) => g.component === 'CoinListComponent');
    expect(coin.columns).toBeUndefined();
    expect(coin.columnsCount).toBe(2);
  });

  it('con pTable=false esclude le tabelle PrimeNG', () => {
    const tree = buildTree();
    run(tree, {output: 'r.json', format: 'json', pTable: false});
    const json = readJson(tree, '/r.json');
    expect(json.summary.pTable).toBe(0);
    expect(json.grids.find((g: any) => g.kind === 'p-table')).toBeUndefined();
  });

  it('con format=json senza output scrive table-report.json (default segue il formato)', () => {
    const tree = buildTree();
    run(tree, {format: 'json'});
    expect(tree.exists('/table-report.md')).toBe(false);
    const json = readJson(tree, '/table-report.json');
    expect(Array.isArray(json.grids)).toBe(true);
  });

  it('con output stringa vuota non scrive alcun file (solo console)', () => {
    const tree = buildTree();
    run(tree, {output: ''});
    expect(tree.exists('/table-report.md')).toBe(false);
    expect(tree.exists('/table-report.json')).toBe(false);
  });
});

/**
 * Regressioni dalla review adversariale: ogni test riproduce un difetto confermato
 * dell'implementazione iniziale e ne fissa il comportamento corretto.
 */
describe('table-report schematic (Rule) — regressioni dalla review', () => {
  function run(tree: Tree, options: any): void {
    const context = {logger: {info: (): void => undefined}} as any;
    tableReport(options)(tree, context);
  }

  function runJson(tree: Tree): any {
    run(tree, {output: 'r.json', format: 'json'});
    const raw = tree.read('/r.json');
    expect(raw).not.toBeNull();
    return JSON.parse((raw || Buffer.from('{}')).toString());
  }

  it('griglia dichiarata da un modulo alla radice di pathApp (AppModule) non e\' orfana', () => {
    const tree = new HostTree();
    tree.create(
      '/src/app/app.module.ts',
      'import {GridWidgetComponent} from "./widgets/grid-widget.component"; export class AppModule {}'
    );
    tree.create('/src/app/app.component.html', '<app-grid-widget></app-grid-widget>');
    tree.create(
      '/src/app/widgets/grid-widget.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-grid-widget\',\n' +
        '  template: \'<ag-grid-angular [columnDefs]="cols"></ag-grid-angular>\',\n' +
        '})\n' +
        'export class GridWidgetComponent { cols = [{field: \'a\'}]; }\n'
    );
    const json = runJson(tree);
    expect(json.grids.length).toBe(1);
    expect(json.grids[0].referenced).toBe(true);
    expect(json.grids[0].isOrphan).toBe(false);
  });

  it('selettore prefisso di un altro selettore non genera falsi riferimenti', () => {
    const tree = new HostTree();
    // 'app-log' mai usato; 'app-log-list' (prefisso comune) usato altrove
    tree.create(
      '/src/app/core/log/log.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-log\',\n' +
        '  standalone: true,\n' +
        '  template: \'<ag-grid-angular [columnDefs]="cols"></ag-grid-angular>\',\n' +
        '})\n' +
        'export class LogComponent { cols = [{field: \'x\'}]; }\n'
    );
    tree.create(
      '/src/app/main/views/dash/dash.component.html',
      '<app-log-list [collection]="x"></app-log-list>'
    );
    const json = runJson(tree);
    expect(json.grids[0].isOrphan).toBe(true);
  });

  it('un \'>\' dentro un binding non tronca il tag e [columnDefs] con nome custom viene risolto', () => {
    const tree = new HostTree();
    tree.create(
      '/src/app/main/views/coin/coin-list/coin-list.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-coin-list\',\n' +
        '  standalone: true,\n' +
        '  templateUrl: \'./coin-list.component.html\',\n' +
        '})\n' +
        'export class CoinListComponent { myCols: any[] = [{field: \'id\'}, {field: \'name\'}]; rows = []; }\n'
    );
    tree.create(
      '/src/app/main/views/coin/coin-list/coin-list.component.html',
      '<ag-grid-angular *ngIf="rows.length > 0" [rowData]="rows" [columnDefs]="myCols"></ag-grid-angular>'
    );
    tree.create('/src/app/app.component.html', '<app-coin-list></app-coin-list>');
    const json = runJson(tree);
    const g = json.grids[0];
    expect(g.columnsCount).toBe(2);
    expect(g.columns[1].field).toBe('name');
    expect(g.bindings).toContain('rowData');
    expect(g.bindings).toContain('columnDefs');
  });

  it('template inline con interpolazione ${} viene scansionato; file sotto pathView senza sezione', () => {
    const tree = new HostTree();
    tree.create(
      '/src/app/main/views/quick.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-quick\',\n' +
        '  standalone: true,\n' +
        '  template: `<ag-grid-angular style="height: ${this.h}px" [columnDefs]="cols"></ag-grid-angular>`,\n' +
        '})\n' +
        'export class QuickComponent { cols = [{field: \'q\'}]; h = 10; }\n'
    );
    tree.create('/src/app/app.component.html', '<app-quick></app-quick>');
    const json = runJson(tree);
    expect(json.summary.agGrid).toBe(1);
    const g = json.grids[0];
    expect(g.columnsCount).toBe(1);
    expect(g.section).toBeNull();
    expect(g.where).toBe('views');
  });

  it('templateUrl assoluto viene risolto', () => {
    const tree = new HostTree();
    tree.create(
      '/src/app/main/views/s/s-list.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-s-list\',\n' +
        '  standalone: true,\n' +
        '  templateUrl: \'/src/app/main/views/s/s-list.component.html\',\n' +
        '})\n' +
        'export class SListComponent { cols = [{field: \'s\'}]; }\n'
    );
    tree.create(
      '/src/app/main/views/s/s-list.component.html',
      '<ag-grid-angular [columnDefs]="cols"></ag-grid-angular>'
    );
    tree.create('/src/app/app.component.html', '<app-s-list></app-s-list>');
    const json = runJson(tree);
    expect(json.summary.agGrid).toBe(1);
    expect(json.grids[0].templateFile).toBe('src/app/main/views/s/s-list.component.html');
  });

  it('<p-tableCheckbox> senza <p-table> non produce griglie fantasma', () => {
    const tree = new HostTree();
    tree.create(
      '/src/app/main/views/x/x.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-x\',\n' +
        '  standalone: true,\n' +
        '  template: \'<p-tableHeaderCheckbox></p-tableHeaderCheckbox><p-tableCheckbox [value]="r"></p-tableCheckbox>\',\n' +
        '})\n' +
        'export class XComponent { r = 1; }\n'
    );
    const json = runJson(tree);
    expect(json.summary.grids).toBe(0);
  });

  it('la prima assegnazione this.cols in ordine di documento vince su un reset successivo', () => {
    const tree = new HostTree();
    tree.create(
      '/src/app/main/views/y/y.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-y\',\n' +
        '  standalone: true,\n' +
        '  template: \'<ag-grid-angular [columnDefs]="cols"></ag-grid-angular>\',\n' +
        '})\n' +
        'export class YComponent {\n' +
        '  cols: any[];\n' +
        '  ngOnInit() { this.cols = [{field: \'id\'}, {field: \'name\'}]; }\n' +
        '  clear() { this.cols = []; }\n' +
        '}\n'
    );
    tree.create('/src/app/app.component.html', '<app-y></app-y>');
    const json = runJson(tree);
    const g = json.grids[0];
    expect(g.columnsSource).toBe('assignment');
    expect(g.columnsCount).toBe(2);
  });

  it('un // dentro una stringa non nasconde un riferimento sulla stessa riga', () => {
    const tree = new HostTree();
    tree.create(
      '/src/app/core/str/str-grid.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-str-grid\',\n' +
        '  standalone: true,\n' +
        '  template: \'<ag-grid-angular [columnDefs]="cols"></ag-grid-angular>\',\n' +
        '})\n' +
        'export class StrGridComponent { cols = [{field: \'z\'}]; }\n'
    );
    tree.create(
      '/src/app/core/uses.ts',
      'const tag = "x // y"; export const uses = StrGridComponent;'
    );
    const json = runJson(tree);
    expect(json.grids[0].referenced).toBe(true);
  });

  it('legge i percorsi custom da ngrx-entity-crud.conf.json', () => {
    const tree = new HostTree();
    tree.create(
      '/ngrx-entity-crud.conf.json',
      JSON.stringify({
        pathApp: 'projects/demo/src/app',
        pathStore: 'projects/demo/src/app/root-store',
        pathView: 'projects/demo/src/app/views',
      })
    );
    tree.create('/projects/demo/src/app/root-store/coin-store/coin.state.ts', 'export const s = {};');
    tree.create(
      '/projects/demo/src/app/views/coin/coin-list/coin-list.component.ts',
      'import {Component} from "@angular/core";\n' +
        'import {CoinStoreSelectors} from "@root-store";\n' +
        '@Component({\n' +
        '  selector: \'app-coin-list\',\n' +
        '  standalone: true,\n' +
        '  template: \'<ag-grid-angular [columnDefs]="cols"></ag-grid-angular>\',\n' +
        '})\n' +
        'export class CoinListComponent { cols = [{field: \'id\'}]; s = CoinStoreSelectors; }\n'
    );
    tree.create('/projects/demo/src/app/app.component.html', '<app-coin-list></app-coin-list>');
    const json = runJson(tree);
    expect(json.paths.pathApp).toBe('projects/demo/src/app');
    expect(json.summary.agGrid).toBe(1);
    expect(json.grids[0].section).toBe('coin');
    expect(json.grids[0].stores).toEqual(['coin']);
  });

  it('standalone default true per consumer Angular >= 19', () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({dependencies: {'@angular/core': '^19.2.0'}}));
    tree.create(
      '/src/app/main/views/z/z.component.ts',
      'import {Component} from "@angular/core";\n' +
        '@Component({\n' +
        '  selector: \'app-z\',\n' +
        '  template: \'<ag-grid-angular [columnDefs]="cols"></ag-grid-angular>\',\n' +
        '})\n' +
        'export class ZComponent { cols = [{field: \'k\'}]; }\n'
    );
    tree.create('/src/app/app.component.html', '<app-z></app-z>');
    const json = runJson(tree);
    expect(json.grids[0].standalone).toBe(true);
  });
});
