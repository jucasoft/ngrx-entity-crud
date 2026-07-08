import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
// Stesso precedente di my-utility.ts: la compiler API TypeScript e' sempre presente nel
// workspace Angular del consumer, quindi non cambia la postura delle dipendenze del pacchetto.
import * as ts from 'typescript/lib/tsserverlibrary';

interface Paths {
  pathApp: string;
  pathStore: string;
  pathView: string;
}

interface ColumnInfo {
  field: string | null;
  headerName: string | null;
  props: string[]; // tutti i nomi di proprieta' dell'object literal della colonna
}

interface GridInfo {
  component: string;
  selector: string | null;
  file: string;
  kind: 'ag-grid' | 'p-table';
  standalone: boolean;
  inlineTemplate: boolean;
  templateFile: string | null;
  tagCount: number;
  area: 'views' | 'core' | 'shell' | 'other';
  section: string | null;
  where: string; // etichetta di posizione per il report
  stores: string[];
  theme: string | null;
  bindings: string[];
  columns: ColumnInfo[];
  columnsSource: 'class-property' | 'assignment' | 'runtime-keys' | 'none';
  columnsDynamicEntries: number;
  colDefType: string | null;
  defaultColDefProps: string[];
  gridOptionsProps: string[];
  referenced: boolean;
  referencedBy: string[];
}

interface ComponentMeta {
  className: string;
  selector: string | null;
  template: string | null;
  templateUrl: string | null;
  standalone: boolean;
  classNode: ts.ClassDeclaration;
}

// Identifica i riferimenti agli store generati: XxxStoreActions/Selectors/State/Module/Service
// (stessa convenzione di lazy-report).
const STORE_REF = /\b([A-Z][A-Za-z0-9]*)Store(?:Actions|Selectors|State|Module|Service)\b/g;

function toRoot(p: string): string {
  return '/' + p.replace(/^\/+/, '').replace(/\/+$/, '');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readJson(tree: Tree, file: string): Record<string, unknown> | null {
  const buf = tree.read(file);
  if (!buf) {
    return null;
  }
  try {
    return JSON.parse(buf.toString());
  } catch {
    return null;
  }
}

function readPaths(tree: Tree): Paths {
  const paths: Paths = {
    pathApp: 'src/app',
    pathStore: 'src/app/root-store',
    pathView: 'src/app/main/views',
  };
  const conf = readJson(tree, '/ngrx-entity-crud.conf.json');
  if (conf) {
    if (typeof conf.pathApp === 'string') {
      paths.pathApp = conf.pathApp;
    }
    if (typeof conf.pathStore === 'string') {
      paths.pathStore = conf.pathStore;
    }
    if (typeof conf.pathView === 'string') {
      paths.pathView = conf.pathView;
    }
  }
  return paths;
}

function listSubdirs(tree: Tree, dirPath: string): string[] {
  return tree.getDir(toRoot(dirPath)).subdirs.map((d) => d.toString());
}

function collectFiles(tree: Tree, dirPath: string, exts: string[]): string[] {
  const out: string[] = [];
  const root = toRoot(dirPath);
  const dir = tree.getDir(root);
  dir.subfiles.forEach((f) => {
    const name = f.toString();
    const wanted = exts.some((e) => name.endsWith(e));
    if (wanted && !name.endsWith('.spec.ts') && !name.endsWith('.d.ts')) {
      out.push(`${root}/${name}`);
    }
  });
  dir.subdirs.forEach((d) => {
    out.push(...collectFiles(tree, `${root}/${d.toString()}`, exts));
  });
  return out;
}

function stripHtmlComments(content: string): string {
  return content.replace(/<!--[\s\S]*?-->/g, '');
}

// Rimuove i commenti TS rispettando stringhe e template literal (scanner a stati: un '//'
// dentro una stringa non tronca la riga). Best-effort: i regex literal non sono trattati.
function stripTsComments(content: string): string {
  let out = '';
  let i = 0;
  let mode: 'code' | 'single' | 'double' | 'backtick' | 'line' | 'block' = 'code';
  while (i < content.length) {
    const c = content[i];
    const next = i + 1 < content.length ? content[i + 1] : '';
    if (mode === 'code') {
      if (c === '/' && next === '/') {
        mode = 'line';
        i += 2;
        continue;
      }
      if (c === '/' && next === '*') {
        mode = 'block';
        i += 2;
        continue;
      }
      if (c === '\'') {
        mode = 'single';
      } else if (c === '"') {
        mode = 'double';
      } else if (c === '`') {
        mode = 'backtick';
      }
      out += c;
      i++;
      continue;
    }
    if (mode === 'line') {
      if (c === '\n') {
        mode = 'code';
        out += c;
      }
      i++;
      continue;
    }
    if (mode === 'block') {
      if (c === '*' && next === '/') {
        mode = 'code';
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    // dentro una stringa
    if (c === '\\') {
      out += c + next;
      i += 2;
      continue;
    }
    if (
      (mode === 'single' && c === '\'') ||
      (mode === 'double' && c === '"') ||
      (mode === 'backtick' && c === '`')
    ) {
      mode = 'code';
    }
    out += c;
    i++;
  }
  return out;
}

function storeKeysInContent(content: string, validKeys: Set<string>): string[] {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  STORE_REF.lastIndex = 0;
  while ((m = STORE_REF.exec(content)) !== null) {
    const key = strings.dasherize(m[1]);
    if (validKeys.has(key)) {
      found.add(key);
    }
  }
  return Array.from(found).sort();
}

function exportedClasses(content: string): string[] {
  const out: string[] = [];
  const re = /export\s+class\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    out.push(m[1]);
  }
  return out;
}

// --- AST helpers -------------------------------------------------------------------------

function literalText(node: ts.Expression): string | null {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) ? node.text : null;
}

// Come literalText, ma accetta anche template literal CON interpolazioni (ricostruiti con un
// placeholder): un template inline con `${...}` non deve far scartare il componente.
function templateLiteralText(node: ts.Expression): string | null {
  const plain = literalText(node);
  if (plain !== null) {
    return plain;
  }
  if (ts.isTemplateExpression(node)) {
    let text = node.head.text;
    node.templateSpans.forEach((s) => {
      text += '__interpolation__' + s.literal.text;
    });
    return text;
  }
  return null;
}

function getClassDecorators(node: ts.ClassDeclaration): readonly ts.Decorator[] {
  // TS >= 4.8 espone getDecorators; fallback per runtime piu' vecchi (node.decorators).
  if (typeof ts.canHaveDecorators === 'function' && typeof ts.getDecorators === 'function') {
    return ts.canHaveDecorators(node) ? ts.getDecorators(node) || [] : [];
  }
  return (node as unknown as {decorators?: readonly ts.Decorator[]}).decorators || [];
}

function findComponents(source: ts.SourceFile, defaultStandalone: boolean): ComponentMeta[] {
  const out: ComponentMeta[] = [];
  source.statements.forEach((st) => {
    if (!ts.isClassDeclaration(st) || !st.name) {
      return;
    }
    const className = st.name.text;
    getClassDecorators(st).forEach((dec) => {
      if (!ts.isCallExpression(dec.expression) || !ts.isIdentifier(dec.expression.expression)) {
        return;
      }
      if (dec.expression.expression.text !== 'Component') {
        return;
      }
      const meta: ComponentMeta = {
        className,
        selector: null,
        template: null,
        templateUrl: null,
        // da Angular 19 il default di @Component e' standalone: true
        standalone: defaultStandalone,
        classNode: st,
      };
      const arg = dec.expression.arguments[0];
      if (arg && ts.isObjectLiteralExpression(arg)) {
        arg.properties.forEach((p) => {
          if (!ts.isPropertyAssignment(p) || !ts.isIdentifier(p.name)) {
            return;
          }
          const key = p.name.text;
          if (key === 'selector') {
            meta.selector = literalText(p.initializer);
          } else if (key === 'template') {
            meta.template = templateLiteralText(p.initializer);
          } else if (key === 'templateUrl') {
            meta.templateUrl = literalText(p.initializer);
          } else if (key === 'standalone') {
            if (p.initializer.kind === ts.SyntaxKind.TrueKeyword) {
              meta.standalone = true;
            } else if (p.initializer.kind === ts.SyntaxKind.FalseKeyword) {
              meta.standalone = false;
            }
          }
        });
      }
      out.push(meta);
    });
  });
  return out;
}

function findClassProperty(cls: ts.ClassDeclaration, name: string): ts.PropertyDeclaration | null {
  for (const m of cls.members) {
    if (
      ts.isPropertyDeclaration(m) &&
      m.name &&
      (ts.isIdentifier(m.name) || ts.isStringLiteral(m.name)) &&
      m.name.text === name
    ) {
      return m;
    }
  }
  return null;
}

// Cerca `this.<name> = [...]` nella classe (costruttore, ngOnInit, ...): DFS pre-order, cosi'
// vince la PRIMA assegnazione in ordine di documento (un reset successivo non maschera le colonne).
function findThisAssignment(cls: ts.ClassDeclaration, name: string): ts.ArrayLiteralExpression | null {
  const stack: ts.Node[] = [cls];
  while (stack.length) {
    const node = stack.pop() as ts.Node;
    if (
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(node.left) &&
      node.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
      node.left.name.text === name &&
      ts.isArrayLiteralExpression(node.right)
    ) {
      return node.right;
    }
    const children: ts.Node[] = [];
    node.forEachChild((c) => {
      children.push(c);
      return undefined;
    });
    for (let i = children.length - 1; i >= 0; i--) {
      stack.push(children[i]);
    }
  }
  return null;
}

function objectPropNames(obj: ts.ObjectLiteralExpression): string[] {
  const names: string[] = [];
  obj.properties.forEach((p) => {
    if (ts.isSpreadAssignment(p)) {
      names.push('...');
      return;
    }
    const name = p.name;
    if (name && (ts.isIdentifier(name) || ts.isStringLiteral(name))) {
      names.push(name.text);
    }
  });
  return names;
}

function extractColumnsFromArray(arr: ts.ArrayLiteralExpression): {
  columns: ColumnInfo[];
  dynamic: number;
} {
  const columns: ColumnInfo[] = [];
  let dynamic = 0;
  arr.elements.forEach((el) => {
    if (!ts.isObjectLiteralExpression(el)) {
      // spread, chiamate a factory, identificatori: non analizzabili staticamente
      dynamic++;
      return;
    }
    const col: ColumnInfo = {field: null, headerName: null, props: objectPropNames(el)};
    el.properties.forEach((p) => {
      if (!ts.isPropertyAssignment(p) || !(ts.isIdentifier(p.name) || ts.isStringLiteral(p.name))) {
        return;
      }
      if (p.name.text === 'field') {
        col.field = literalText(p.initializer);
      } else if (p.name.text === 'headerName') {
        col.headerName = literalText(p.initializer);
      }
    });
    columns.push(col);
  });
  return {columns, dynamic};
}

function objectPropsOfClassProperty(cls: ts.ClassDeclaration, name: string): string[] {
  const prop = findClassProperty(cls, name);
  if (prop && prop.initializer && ts.isObjectLiteralExpression(prop.initializer)) {
    return objectPropNames(prop.initializer);
  }
  return [];
}

// --- template helpers --------------------------------------------------------------------

// Estrae i corpi di TUTTI i tag `<tag ...>`: boundary sul nome (cosi' `p-table` non matcha
// `p-tableCheckbox`) e stato delle quote (un '>' dentro `*ngIf="x > 0"` non tronca il tag).
function extractTagBodies(template: string, tag: string): string[] {
  const bodies: string[] = [];
  const open = '<' + tag;
  let idx = 0;
  while ((idx = template.indexOf(open, idx)) !== -1) {
    const after = template[idx + open.length];
    if (after !== undefined && !/[\s/>]/.test(after)) {
      idx += open.length;
      continue;
    }
    let i = idx + open.length;
    let quote: string | null = null;
    let body = '';
    while (i < template.length) {
      const c = template[i];
      if (quote) {
        if (c === quote) {
          quote = null;
        }
      } else if (c === '"' || c === '\'') {
        quote = c;
      } else if (c === '>') {
        break;
      }
      body += c;
      i++;
    }
    bodies.push(body);
    idx = i;
  }
  return bodies;
}

function tagAttrNames(tagBody: string): string[] {
  const names = new Set<string>();
  const re = /([[(]{0,2}[\w.$-]+[\])]{0,2})\s*=\s*"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(tagBody)) !== null) {
    const name = m[1].replace(/[[\]()]/g, '');
    if (name !== 'class' && name !== 'style') {
      names.add(name);
    }
  }
  return Array.from(names);
}

function tagBindingExpr(tagBody: string, name: string): string | null {
  const m = new RegExp('\\[' + name + '\\]\\s*=\\s*"([^"]*)"').exec(tagBody);
  return m ? m[1].trim() : null;
}

function resolveTemplatePath(componentFile: string, templateUrl: string): string {
  if (templateUrl.startsWith('/')) {
    // templateUrl assoluto rispetto alla root del workspace
    return toRoot(templateUrl);
  }
  const dir = componentFile.substring(0, componentFile.lastIndexOf('/'));
  const parts = (dir + '/' + templateUrl).split('/');
  const out: string[] = [];
  parts.forEach((p) => {
    if (p === '..') {
      out.pop();
    } else if (p !== '.' && p !== '') {
      out.push(p);
    }
  });
  return '/' + out.join('/');
}

// --- report helpers ----------------------------------------------------------------------

function locate(file: string, paths: Paths): {area: GridInfo['area']; section: string | null; where: string} {
  const viewRoot = toRoot(paths.pathView) + '/';
  const appRoot = toRoot(paths.pathApp) + '/';
  if (file.startsWith(viewRoot)) {
    const seg = file.substring(viewRoot.length).split('/')[0] || '';
    // un file direttamente sotto pathView non appartiene a nessuna sezione
    const section = seg && seg.indexOf('.') === -1 ? seg : null;
    return {area: 'views', section, where: section ? `views/${section}` : 'views'};
  }
  if (file.startsWith(appRoot)) {
    const rel = file.substring(appRoot.length);
    if (rel.indexOf('/') === -1 || rel.startsWith('main/components/')) {
      return {area: 'shell', section: null, where: rel.indexOf('/') === -1 ? '(app shell)' : rel.substring(0, rel.lastIndexOf('/'))};
    }
    if (rel.startsWith('core/')) {
      return {area: 'core', section: null, where: rel.substring(0, rel.lastIndexOf('/'))};
    }
    return {area: 'other', section: null, where: rel.substring(0, rel.lastIndexOf('/'))};
  }
  return {area: 'other', section: null, where: file};
}

function detectTablePackages(tree: Tree): Array<{name: string; version: string}> {
  const pkg = readJson(tree, '/package.json');
  const out: Array<{name: string; version: string}> = [];
  if (pkg) {
    const all: Record<string, unknown> = {};
    Object.assign(
      all,
      (pkg.dependencies as Record<string, unknown>) || {},
      (pkg.devDependencies as Record<string, unknown>) || {}
    );
    Object.keys(all)
      .sort()
      .forEach((name) => {
        // copre sia i bare package (ag-grid-community/-angular/-enterprise) sia i modulari scoped
        const isAgGrid =
          /^ag-grid(-|$)/.test(name) ||
          name.startsWith('@ag-grid-community/') ||
          name.startsWith('@ag-grid-enterprise/');
        if (isAgGrid || name === 'primeng') {
          out.push({name, version: String(all[name])});
        }
      });
  }
  return out;
}

function detectAngularMajor(tree: Tree): number | null {
  const pkg = readJson(tree, '/package.json');
  if (!pkg) {
    return null;
  }
  const all: Record<string, unknown> = {};
  Object.assign(
    all,
    (pkg.dependencies as Record<string, unknown>) || {},
    (pkg.devDependencies as Record<string, unknown>) || {}
  );
  const v = all['@angular/core'];
  if (typeof v !== 'string') {
    return null;
  }
  const m = /(\d+)/.exec(v);
  return m ? parseInt(m[1], 10) : null;
}

function gridVerdict(g: GridInfo): string {
  if (!g.referenced) {
    return 'orphan? (not referenced by any used template/module)';
  }
  if (g.kind === 'p-table') {
    return g.columnsSource === 'runtime-keys' ? 'ok (runtime columns)' : 'ok';
  }
  if (g.columnsSource === 'none') {
    return 'columns not statically analyzable';
  }
  if (g.columnsDynamicEntries > 0) {
    return `ok (${g.columnsDynamicEntries} dynamic column entries skipped)`;
  }
  return 'ok';
}

function rel(p: string | null): string {
  return p === null ? '' : p.replace(/^\//, '');
}

export function tableReport(options: TableReport): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const paths = readPaths(tree);
    const format = options.format || 'md';
    // Il default segue il formato: senza --output un --format=json produce table-report.json.
    const output = options.output === undefined ? `table-report.${format}` : options.output;
    const includeColumns = options.columns !== false;
    const includePTable = options.pTable !== false;
    const appRoot = toRoot(paths.pathApp);
    const angularMajor = detectAngularMajor(tree);
    const defaultStandalone = angularMajor !== null && angularMajor >= 19;

    // 1. Indicizza i sorgenti dell'app (.ts + .html, esclusi spec e d.ts): le griglie possono
    //    vivere anche in template inline dentro i .ts e fuori da pathView.
    const tsFiles = collectFiles(tree, paths.pathApp, ['.ts']);
    const htmlFiles = collectFiles(tree, paths.pathApp, ['.html']);
    const rawContent = new Map<string, string>();
    tsFiles.concat(htmlFiles).forEach((f) => {
      const buf = tree.read(f);
      if (buf) {
        rawContent.set(f, buf.toString());
      }
    });
    // Contenuti "puliti" per la ricerca dei riferimenti: i commenti non contano come uso.
    const cleanContent = new Map<string, string>();
    rawContent.forEach((content, f) => {
      cleanContent.set(
        f,
        f.endsWith('.html') ? stripHtmlComments(content) : stripHtmlComments(stripTsComments(content))
      );
    });
    const contentEntries = Array.from(cleanContent.entries());
    const moduleDirs = new Set<string>();
    tsFiles.forEach((f) => {
      if (f.endsWith('.module.ts')) {
        moduleDirs.add(f.substring(0, f.lastIndexOf('/')));
      }
    });

    // 2. Store noti (per correlare griglia -> slice), stessa convenzione di lazy-report.
    const validKeys = new Set<string>(
      listSubdirs(tree, paths.pathStore)
        .filter((d) => d.endsWith('-store'))
        .map((d) => d.replace(/-store$/, ''))
    );

    // 3. Scoperta griglie: ogni componente il cui template contiene <ag-grid-angular> o <p-table>.
    const grids: GridInfo[] = [];
    tsFiles.forEach((file) => {
      const content = rawContent.get(file);
      if (!content) {
        return;
      }
      const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
      findComponents(source, defaultStandalone).forEach((meta) => {
        let template = meta.template;
        let templateFile: string | null = null;
        if (template === null && meta.templateUrl) {
          templateFile = resolveTemplatePath(file, meta.templateUrl);
          const raw = rawContent.get(templateFile);
          if (raw !== undefined) {
            template = raw;
          } else {
            const buf = tree.read(templateFile);
            template = buf ? buf.toString() : null;
          }
        }
        if (template === null) {
          return;
        }
        const cleanedTemplate = stripHtmlComments(template);
        (['ag-grid', 'p-table'] as Array<'ag-grid' | 'p-table'>).forEach((kind) => {
          if (kind === 'p-table' && !includePTable) {
            return;
          }
          const tag = kind === 'ag-grid' ? 'ag-grid-angular' : 'p-table';
          const bodies = extractTagBodies(cleanedTemplate, tag);
          if (bodies.length === 0) {
            return;
          }
          const bindingsSet = new Set<string>();
          bodies.forEach((b) => tagAttrNames(b).forEach((n) => bindingsSet.add(n)));
          const loc = locate(file, paths);
          const grid: GridInfo = {
            component: meta.className,
            selector: meta.selector,
            file,
            kind,
            standalone: meta.standalone,
            inlineTemplate: templateFile === null,
            templateFile,
            tagCount: bodies.length,
            area: loc.area,
            section: loc.section,
            where: loc.where,
            stores: storeKeysInContent(content, validKeys),
            theme: null,
            bindings: Array.from(bindingsSet),
            columns: [],
            columnsSource: 'none',
            columnsDynamicEntries: 0,
            colDefType: null,
            defaultColDefProps: [],
            gridOptionsProps: [],
            referenced: false,
            referencedBy: [],
          };
          if (kind === 'ag-grid') {
            const themeMatch = /ag-theme-[a-z0-9-]+/i.exec(cleanedTemplate);
            grid.theme = themeMatch ? themeMatch[0] : null;
            // La proprieta' delle colonne e' quella legata a [columnDefs] nel primo tag che la
            // espone (default: columnDefs), estratta dall'AST della classe.
            let bindTarget: string | null = null;
            for (const b of bodies) {
              bindTarget = tagBindingExpr(b, 'columnDefs');
              if (bindTarget) {
                break;
              }
            }
            const propName =
              bindTarget && /^[A-Za-z_$][\w$]*$/.test(bindTarget) ? bindTarget : 'columnDefs';
            const prop = findClassProperty(meta.classNode, propName);
            if (prop && prop.type) {
              grid.colDefType = prop.type.getText().replace(/\s+/g, '').replace(/\[\]$/, '');
            }
            if (prop && prop.initializer && ts.isArrayLiteralExpression(prop.initializer)) {
              const extracted = extractColumnsFromArray(prop.initializer);
              grid.columns = extracted.columns;
              grid.columnsDynamicEntries = extracted.dynamic;
              grid.columnsSource = 'class-property';
            } else {
              const assigned = findThisAssignment(meta.classNode, propName);
              if (assigned) {
                const extracted = extractColumnsFromArray(assigned);
                grid.columns = extracted.columns;
                grid.columnsDynamicEntries = extracted.dynamic;
                grid.columnsSource = 'assignment';
              }
            }
            grid.defaultColDefProps = objectPropsOfClassProperty(meta.classNode, 'defaultColDef');
            grid.gridOptionsProps = objectPropsOfClassProperty(meta.classNode, 'gridOptions');
          } else if (content.indexOf('Object.keys(') !== -1) {
            // convenzione dello schematic `section`: colonne calcolate a runtime dal primo item
            grid.columnsSource = 'runtime-keys';
          }
          grids.push(grid);
        });
      });
    });

    // 4a. Liveness transitiva dei moduli: un modulo e' "vivo" se sta alla radice di pathApp
    //     (AppModule/AppRoutingModule/shared: importati da main.ts, fuori dal perimetro di
    //     scansione), se una sua classe e' usata da un file non-modulo, o se e' usato da un
    //     altro modulo a sua volta vivo (es. loadChildren in app-routing).
    const moduleLiveness = new Map<string, {live: boolean; via: string | null}>();
    const isModuleLive = (moduleFile: string, visiting: Set<string>): {live: boolean; via: string | null} => {
      const cached = moduleLiveness.get(moduleFile);
      if (cached) {
        return cached;
      }
      if (visiting.has(moduleFile)) {
        return {live: false, via: null};
      }
      visiting.add(moduleFile);
      let result: {live: boolean; via: string | null} = {live: false, via: null};
      if (moduleFile.substring(0, moduleFile.lastIndexOf('/')) === appRoot) {
        result = {live: true, via: null};
      } else {
        const classes = exportedClasses(cleanContent.get(moduleFile) || '');
        const classRes = classes.map((c) => new RegExp('\\b' + escapeRegExp(c) + '\\b'));
        for (const [f, content] of contentEntries) {
          if (f === moduleFile || !classRes.some((re) => re.test(content))) {
            continue;
          }
          if (!f.endsWith('.module.ts')) {
            result = {live: true, via: f};
            break;
          }
          if (isModuleLive(f, visiting).live) {
            result = {live: true, via: f};
            break;
          }
        }
      }
      visiting.delete(moduleFile);
      moduleLiveness.set(moduleFile, result);
      return result;
    };

    // 4b. Riferimenti: una griglia e' "usata" se il suo selettore/classe compare fuori dai suoi
    //     file. I riferimenti interni alla cartella della sua feature (dal modulo antenato piu'
    //     alto in giu') non bastano da soli: la feature deve essere viva (moduli, vedi 4a).
    grids.forEach((g) => {
      const own = new Set<string>([g.file]);
      if (g.templateFile) {
        own.add(g.templateFile);
      }
      const classRe = new RegExp('\\b' + escapeRegExp(g.component) + '\\b');
      // boundary dopo il selettore: '<app-log' non deve matchare '<app-log-list'
      const selectorRe = g.selector
        ? new RegExp('<' + escapeRegExp(g.selector) + '[\\s/>]')
        : null;
      const refs: string[] = [];
      cleanContent.forEach((content, f) => {
        if (own.has(f)) {
          return;
        }
        if ((selectorRe && selectorRe.test(content)) || classRe.test(content)) {
          refs.push(f);
        }
      });
      const gridDir = g.file.substring(0, g.file.lastIndexOf('/'));
      const nonModuleRefs = refs.filter((f) => !f.endsWith('.module.ts'));
      // moduli "dichiaranti": referenziano la griglia e stanno in una directory antenata
      const declaring = refs.filter((f) => {
        if (!f.endsWith('.module.ts')) {
          return false;
        }
        const dir = f.substring(0, f.lastIndexOf('/'));
        return gridDir === dir || gridDir.startsWith(dir + '/');
      });
      let referenced = false;
      const referencedBy: string[] = [];
      if (declaring.length === 0) {
        // standalone o non dichiarata da un modulo antenato: conta ogni uso non-modulo
        referenced = nonModuleRefs.length > 0;
        nonModuleRefs.forEach((f) => referencedBy.push(f));
      } else if (declaring.some((f) => f.substring(0, f.lastIndexOf('/')) === appRoot)) {
        // dichiarata da un modulo alla radice di pathApp (AppModule, shared, routing root):
        // quel modulo e' caricato da main.ts, fuori dalla scansione -> viva per definizione
        referenced = true;
        nonModuleRefs.forEach((f) => referencedBy.push(f));
      } else {
        // familyRoot = antenato piu' ALTO (sotto pathApp) che contiene un modulo: cosi' anche
        // con layout SCAM annidati la feature coincide con l'intera cartella della sezione
        let familyRoot = '';
        if (gridDir.startsWith(appRoot + '/')) {
          let dir = appRoot;
          for (const part of gridDir.substring(appRoot.length + 1).split('/')) {
            dir = dir + '/' + part;
            if (moduleDirs.has(dir)) {
              familyRoot = dir;
              break;
            }
          }
        }
        if (!familyRoot) {
          familyRoot = declaring
            .map((f) => f.substring(0, f.lastIndexOf('/')))
            .reduce((deepest, dir) => (dir.length > deepest.length ? dir : deepest), '');
        }
        const external = refs.filter(
          (f) => declaring.indexOf(f) === -1 && !f.startsWith(familyRoot + '/')
        );
        if (external.length) {
          referenced = true;
          external.forEach((f) => referencedBy.push(f));
        } else {
          for (const moduleFile of declaring) {
            const lv = isModuleLive(moduleFile, new Set<string>());
            if (lv.live) {
              referenced = true;
              const evidence = lv.via || moduleFile;
              if (referencedBy.indexOf(evidence) === -1) {
                referencedBy.push(evidence);
              }
            }
          }
          if (!referenced) {
            // per contesto nel report: gli usi interni della griglia orfana
            nonModuleRefs.forEach((f) => referencedBy.push(f));
          }
        }
      }
      g.referenced = referenced;
      g.referencedBy = referencedBy.sort().slice(0, 5);
    });

    // 5. Componi il report.
    const rows = grids.slice().sort((a, b) => a.file.localeCompare(b.file));
    const packages = detectTablePackages(tree);
    const agGridEnterprise = packages.some(
      (p) => p.name.startsWith('@ag-grid-enterprise/') || p.name === 'ag-grid-enterprise'
    );
    const orphans = rows.filter((g) => !g.referenced);

    const md: string[] = [];
    md.push('# Table report', '');
    md.push('Generated by `ngrx-entity-crud:table-report`.', '');
    md.push(
      `Analyzed paths: app=\`${paths.pathApp}\`, views=\`${paths.pathView}\`, store=\`${paths.pathStore}\`.`,
      ''
    );
    md.push('## Grids', '');
    md.push('| component | kind | where | template | stores | columns | referenced | verdict |');
    md.push('|---|---|---|---|---|---|---|---|');
    rows.forEach((g) => {
      const columnsCell =
        g.kind === 'p-table'
          ? g.columnsSource === 'runtime-keys'
            ? 'runtime'
            : '-'
          : `${g.columns.length}${g.columnsDynamicEntries ? ` (+${g.columnsDynamicEntries} dynamic)` : ''}`;
      md.push(
        `| ${g.component} | ${g.kind} | ${g.where} | ${g.inlineTemplate ? 'inline' : 'external'} | ${
          g.stores.join(', ') || '-'
        } | ${columnsCell} | ${g.referenced ? 'yes' : 'no'} | ${gridVerdict(g)} |`
      );
    });
    if (includeColumns) {
      const detailed = rows.filter(
        (g) => g.kind === 'ag-grid' && (g.columns.length > 0 || g.columnsDynamicEntries > 0)
      );
      if (detailed.length) {
        md.push('', '## Column details', '');
        detailed.forEach((g) => {
          md.push(`### ${g.component} (\`${rel(g.file)}\`)`, '');
          md.push(
            `- colDef type: \`${g.colDefType || 'unknown'}\` | source: ${g.columnsSource} | theme: \`${
              g.theme || '-'
            }\``
          );
          md.push(
            `- defaultColDef: ${g.defaultColDefProps.join(', ') || '-'} | gridOptions: ${
              g.gridOptionsProps.join(', ') || '-'
            }`
          );
          md.push(`- template bindings: ${g.bindings.join(', ') || '-'}`, '');
          md.push('| # | field | headerName | other props |');
          md.push('|---|---|---|---|');
          g.columns.forEach((c, i) => {
            const others = c.props.filter((p) => p !== 'field' && p !== 'headerName');
            md.push(`| ${i + 1} | ${c.field || '-'} | ${c.headerName || '-'} | ${others.join(', ') || '-'} |`);
          });
          if (g.columnsDynamicEntries > 0) {
            md.push('', `_${g.columnsDynamicEntries} dynamic column entries not statically analyzable._`);
          }
          md.push('');
        });
      }
    }
    md.push('', '## Packages', '');
    if (packages.length) {
      md.push('| package | version |');
      md.push('|---|---|');
      packages.forEach((p) => md.push(`| ${p.name} | ${p.version} |`));
      md.push('', `AG Grid Enterprise detected: ${agGridEnterprise ? 'yes' : 'no'}.`);
    } else {
      md.push('_No table-related packages (ag-grid*, primeng) detected in package.json._');
    }
    md.push('', '## Notes', '');
    md.push(
      '- Static analysis: columns are read from `columnDefs` array literals; spread/computed entries are counted as dynamic and skipped.'
    );
    md.push(
      '- `p-table` lists generated by the `section` schematic compute columns at runtime (`Object.keys` of the first row).'
    );
    md.push(
      '- "referenced" follows selector/class usage outside the component (comments stripped). References internal to the feature folder do not count by themselves: the feature module must be alive (used from outside, e.g. `loadChildren`, possibly through a chain of modules).'
    );
    md.push(
      '- Modules at the root of the app path (e.g. `AppModule`, `AppRoutingModule`, shared modules) are considered always loaded: `main.ts` lives outside the scanned tree.'
    );
    md.push(
      '- Liveness is best-effort, not a full reachability analysis: a grid used only by a dead sibling component may still be reported as referenced.'
    );
    md.push('- Inline templates inside `.ts` files are scanned too.');
    const reportMd = md.join('\n') + '\n';

    const jsonReport: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      paths,
      summary: {
        grids: rows.length,
        agGrid: rows.filter((g) => g.kind === 'ag-grid').length,
        pTable: rows.filter((g) => g.kind === 'p-table').length,
        orphans: orphans.length,
        agGridEnterprise,
      },
      packages,
      grids: rows.map((g) => {
        const entry: Record<string, unknown> = {
          component: g.component,
          selector: g.selector,
          file: rel(g.file),
          kind: g.kind,
          standalone: g.standalone,
          inlineTemplate: g.inlineTemplate,
          templateFile: g.templateFile ? rel(g.templateFile) : null,
          tagCount: g.tagCount,
          area: g.area,
          section: g.section,
          where: g.where,
          stores: g.stores,
          theme: g.theme,
          bindings: g.bindings,
          columnsCount: g.columns.length,
          columnsDynamicEntries: g.columnsDynamicEntries,
          columnsSource: g.columnsSource,
          colDefType: g.colDefType,
          defaultColDefProps: g.defaultColDefProps,
          gridOptionsProps: g.gridOptionsProps,
          referenced: g.referenced,
          referencedBy: g.referencedBy.map(rel),
          verdict: gridVerdict(g),
          // Campo strutturato: la dashboard correla per booleano, non parsando `verdict`.
          isOrphan: !g.referenced,
        };
        if (includeColumns) {
          entry.columns = g.columns;
        }
        return entry;
      }),
    };

    // 6. Output: console sempre, file se richiesto.
    context.logger.info(reportMd);
    context.logger.info(
      `Grids: ${rows.length} (ag-grid: ${rows.filter((g) => g.kind === 'ag-grid').length}, ` +
        `p-table: ${rows.filter((g) => g.kind === 'p-table').length}) | orphans: ${orphans.length} | ` +
        `table packages: ${packages.length}`
    );

    if (output) {
      const outPath = toRoot(output);
      const content = format === 'json' ? JSON.stringify(jsonReport, null, 2) + '\n' : reportMd;
      if (tree.exists(outPath)) {
        tree.overwrite(outPath, content);
      } else {
        tree.create(outPath, content);
      }
      context.logger.info(`Report written to ${outPath}`);
    }

    return tree;
  };
}
