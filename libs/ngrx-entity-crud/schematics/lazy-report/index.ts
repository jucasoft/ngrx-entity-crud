import {Rule, SchematicContext, Tree} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';

interface Paths {
  pathApp: string;
  pathStore: string;
  pathView: string;
}

interface StoreInfo {
  name: string; // nome cartella, es. 'coin-store'
  key: string; // prefisso dasherizzato, es. 'coin'
  clazz: string; // prefisso classificato, es. 'Coin'
  type: string; // 'CRUD-PLURAL' | 'CRUD-SINGULAR' | 'unknown'
  infra: boolean;
  sections: string[];
  usedByShell: boolean;
}

// Identifica i riferimenti agli store generati: XxxStoreActions/Selectors/State/Module/Service.
const STORE_REF = /\b([A-Z][A-Za-z0-9]*)Store(?:Actions|Selectors|State|Module|Service)\b/g;

// Provider di persistenza noti, rilevati staticamente da package.json (nessun accoppiamento:
// la dashboard introspeziona comunque IndexedDB in modo agnostico a runtime).
const STORAGE_PROVIDERS = [
  'localforage',
  'idb-keyval',
  'idb',
  'dexie',
  'ngrx-store-idb',
  'ngrx-store-localstorage',
];

function toRoot(p: string): string {
  return '/' + p.replace(/^\/+/, '').replace(/\/+$/, '');
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

function collectTsFiles(tree: Tree, dirPath: string): string[] {
  const out: string[] = [];
  const root = toRoot(dirPath);
  const dir = tree.getDir(root);
  dir.subfiles.forEach((f) => {
    const name = f.toString();
    if (name.endsWith('.ts')) {
      out.push(`${root}/${name}`);
    }
  });
  dir.subdirs.forEach((d) => {
    out.push(...collectTsFiles(tree, `${root}/${d.toString()}`));
  });
  return out;
}

function storeKeysInContent(content: string, validKeys: Set<string>): Set<string> {
  const found = new Set<string>();
  let m: RegExpExecArray | null;
  STORE_REF.lastIndex = 0;
  while ((m = STORE_REF.exec(content)) !== null) {
    const key = strings.dasherize(m[1]);
    if (validKeys.has(key)) {
      found.add(key);
    }
  }
  return found;
}

function detectType(tree: Tree, pathStore: string, info: StoreInfo): string {
  const buf = tree.read(`${toRoot(pathStore)}/${info.name}/${info.key}.state.ts`);
  if (!buf) {
    return 'unknown';
  }
  const c = buf.toString();
  if (c.indexOf('EntitySingleCrudState') !== -1 || c.indexOf('getInitialSingleCrudState') !== -1) {
    return 'CRUD-SINGULAR';
  }
  if (c.indexOf('createEntityAdapter') !== -1 || c.indexOf('EntityCrudState') !== -1) {
    return 'CRUD-PLURAL';
  }
  return 'unknown';
}

function detectStorageProvider(tree: Tree): {providers: string[]; source: string} {
  const pkg = readJson(tree, '/package.json');
  const names = new Set<string>();
  if (pkg) {
    const deps = pkg.dependencies as Record<string, unknown> | undefined;
    const devDeps = pkg.devDependencies as Record<string, unknown> | undefined;
    Object.keys(deps || {})
      .concat(Object.keys(devDeps || {}))
      .forEach((d) => {
        if (STORAGE_PROVIDERS.indexOf(d) !== -1) {
          names.add(d);
        }
      });
  }
  return {providers: Array.from(names).sort(), source: 'package.json'};
}

function verdict(info: StoreInfo, lazySections: Set<string>): string {
  if (info.infra) {
    return 'infra (eager)';
  }
  if (info.usedByShell) {
    return 'tieni eager (usato dalla shell)';
  }
  if (info.sections.length === 0) {
    return 'orfano? (nessuna sezione lo usa)';
  }
  if (info.sections.length > 1) {
    return `multi-sezione (${info.sections.length}) -> valuta modulo condiviso`;
  }
  if (!lazySections.has(info.sections[0])) {
    return 'sezione non lazy-routed -> lazy poco utile';
  }
  return 'candidato lazy';
}

export function lazyReport(options: LazyReport): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const paths = readPaths(tree);
    const format = options.format || 'md';
    // Il default segue il formato: senza --output un --format=json produce lazy-report.json.
    const output = options.output === undefined ? `lazy-report.${format}` : options.output;
    const infraStores =
      options.infraStores && options.infraStores.length ? options.infraStores : ['router-store'];
    const includeStorage = options.storage !== false;
    const storage = includeStorage ? detectStorageProvider(tree) : null;

    // 1. Scopri gli store (sottocartelle *-store di pathStore).
    const stores = new Map<string, StoreInfo>();
    listSubdirs(tree, paths.pathStore)
      .filter((d) => d.endsWith('-store'))
      .forEach((folder) => {
        const key = folder.replace(/-store$/, '');
        const info: StoreInfo = {
          name: folder,
          key,
          clazz: strings.classify(key),
          type: 'unknown',
          infra: infraStores.indexOf(folder) !== -1,
          sections: [],
          usedByShell: false,
        };
        info.type = detectType(tree, paths.pathStore, info);
        stores.set(key, info);
      });
    const validKeys = new Set<string>(stores.keys());

    // 2. Mappa sezione -> store (scansione dei .ts di ogni view).
    const sections = listSubdirs(tree, paths.pathView);
    sections.forEach((section) => {
      const used = new Set<string>();
      collectTsFiles(tree, `${paths.pathView}/${section}`).forEach((file) => {
        const buf = tree.read(file);
        if (buf) {
          storeKeysInContent(buf.toString(), validKeys).forEach((k) => used.add(k));
        }
      });
      used.forEach((k) => {
        const info = stores.get(k);
        if (info) {
          info.sections.push(section);
        }
      });
    });

    // 3. Uso dallo shell (core/, main/components, app.component/app.module): non lazy-izzabile.
    const shellFiles: string[] = [
      `${toRoot(paths.pathApp)}/app.component.ts`,
      `${toRoot(paths.pathApp)}/app.module.ts`,
    ];
    [`${paths.pathApp}/core`, `${paths.pathApp}/main/components`].forEach((d) => {
      shellFiles.push(...collectTsFiles(tree, d));
    });
    shellFiles.forEach((file) => {
      const buf = tree.read(file);
      if (buf) {
        storeKeysInContent(buf.toString(), validKeys).forEach((k) => {
          const info = stores.get(k);
          if (info) {
            info.usedByShell = true;
          }
        });
      }
    });

    // 4. Sezioni su rotta lazy (loadChildren in app-routing.module.ts).
    const routingBuf = tree.read(`${toRoot(paths.pathApp)}/app-routing.module.ts`);
    const routingContent = routingBuf ? routingBuf.toString() : '';
    const lazySections = new Set<string>();
    sections.forEach((section) => {
      if (routingContent.indexOf(`views/${section}/${section}.module`) !== -1) {
        lazySections.add(section);
      }
    });

    // 5. Componi il report.
    const rows = Array.from(stores.values()).sort((a, b) => a.name.localeCompare(b.name));
    const candidates = rows.filter((s) => verdict(s, lazySections) === 'candidato lazy');

    const md: string[] = [];
    md.push('# Lazy store report', '');
    md.push('Generato da `ngrx-entity-crud:lazy-report`.', '');
    md.push(
      `Path analizzati: store=\`${paths.pathStore}\`, views=\`${paths.pathView}\`, app=\`${paths.pathApp}\`.`,
      ''
    );
    md.push('## Store -> sezioni', '');
    md.push('| store | clazz | type | sezioni | n | lazy route | shell | verdetto |');
    md.push('|---|---|---|---|---|---|---|---|');
    rows.forEach((s) => {
      const lazyRoute =
        s.sections.length === 0
          ? '-'
          : s.sections.every((x) => lazySections.has(x))
            ? 'si'
            : 'no/parziale';
      md.push(
        `| ${s.name} | ${s.clazz} | ${s.type} | ${s.sections.join(', ') || '-'} | ${s.sections.length} | ${lazyRoute} | ${s.usedByShell ? 'si' : 'no'} | ${verdict(s, lazySections)} |`
      );
    });
    md.push('', '## Candidati lazy', '');
    if (candidates.length === 0) {
      md.push('_Nessun candidato lazy individuato._');
    } else {
      candidates.forEach((s) => {
        const type = s.type === 'unknown' ? 'CRUD-PLURAL' : s.type;
        md.push(`- **${s.clazz}** (\`${s.name}\`), usato da \`${s.sections[0]}\`:`);
        md.push(
          `  - \`ng generate ngrx-entity-crud:store --clazz=${s.clazz} --type=${type} --registration=lazy\``
        );
        md.push(`  - poi importa \`${s.clazz}StoreModule\` nel modulo \`${s.sections[0]}.module.ts\` della view.`);
      });
    }
    if (storage) {
      md.push('', '## Storage', '');
      if (storage.providers.length) {
        md.push(
          `Provider di persistenza rilevati in package.json: ${storage.providers
            .map((p) => '`' + p + '`')
            .join(', ')}.`
        );
      } else {
        md.push('_Nessun provider di persistenza noto rilevato in package.json._');
      }
      md.push('La dashboard introspeziona comunque IndexedDB/localStorage in modo agnostico a runtime.');
    }
    md.push('', '## Note', '');
    md.push('- Analisi statica basata sulle convenzioni di naming (`XxxStoreActions/Selectors/State/Module`).');
    md.push('- Verifica manuale per accoppiamenti nascosti (effect/selettori che combinano piu store).');
    md.push('- Gli store usati dallo shell (`core/`, `main/components`, `app.component`) restano eager.');
    const reportMd = md.join('\n') + '\n';

    const jsonReport: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      paths,
      stores: rows.map((s) => {
        const v = verdict(s, lazySections);
        return {
          name: s.name,
          clazz: s.clazz,
          type: s.type,
          infra: s.infra,
          sections: s.sections,
          usedByShell: s.usedByShell,
          verdict: v,
          // Campi strutturati: la dashboard correla per booleano, non parsando `verdict`.
          lazyRoute: s.sections.length > 0 && s.sections.every((x) => lazySections.has(x)),
          isLazyCandidate: v === 'candidato lazy',
        };
      }),
    };
    if (storage) {
      jsonReport.storage = storage;
    }

    // 6. Output: console sempre, file se richiesto.
    context.logger.info(reportMd);
    context.logger.info(
      `Store: ${rows.length} | sezioni: ${sections.length} | candidati lazy: ${candidates.length}`
    );

    if (output) {
      const outPath = toRoot(output);
      const content = format === 'json' ? JSON.stringify(jsonReport, null, 2) + '\n' : reportMd;
      if (tree.exists(outPath)) {
        tree.overwrite(outPath, content);
      } else {
        tree.create(outPath, content);
      }
      context.logger.info(`Report scritto in ${outPath}`);
    }

    return tree;
  };
}
