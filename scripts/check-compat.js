#!/usr/bin/env node
/**
 * Guardia di compatibilità del pacchetto compilato con le app consumer Angular 16 + PrimeNG 16.
 *
 * La libreria si compila con l'ultima Angular/PrimeNG ma il codice Ivy "partial" del dist viene
 * linkato dal compilatore dell'app consumer: ciò che Angular 16 o PrimeNG 16 non conoscono
 * rompe la sua build (o, peggio, la UI a runtime senza errori). Controlli su ogni FESM:
 *
 * - `minVersion` di ogni dichiarazione `ɵɵngDeclare*` ≤ 14.0.0 (control-flow, input/query
 *   signal ecc. lo alzano a 17+);
 * - niente `ChangeDetectionStrategy.Eager`/`.Default`: Angular 22 emette `Default` come
 *   `Eager`, membro sconosciuto al linker v16 (usare OnPush);
 * - niente `$safeNavigationMigration(...)` (migrazione `safe-optional-chaining` di v22);
 * - niente tag PrimeNG con selettore divergente tra v16 e v22 (il matching distingue le
 *   maiuscole): `p-sortIcon`, `p-tableCheckbox`, `p-tableHeaderCheckbox`, `p-progressBar`
 *   e le rispettive forme kebab/minuscole;
 * - ogni `<ng-template pTemplate="x">` porta anche `#x` (PrimeNG 22 legge solo i template
 *   ref), tranne i template per tipo di nodo del `p-tree`, affiancati da un unico `#node`.
 *
 * Usage: node scripts/check-compat.js [cartella-fesm]   (default: dist/ngrx-entity-crud/fesm2022)
 * Esce con codice 1 elencando file e violazioni.
 */
const fs = require('fs');
const path = require('path');

const MAX_MIN_VERSION = '14.0.0';
const TREE_NODE_TEMPLATES = new Set(['store', 'record', 'value', 'note']);
const DIVERGENT_PRIMENG_TAG =
  /<(p-sortIcon|p-sort-icon|p-tableCheckbox|p-table-checkbox|p-tableHeaderCheckbox|p-table-header-checkbox|p-progressBar|p-progress-bar)\b/gi;

const dir = path.resolve(
  process.argv[2] ||
    path.join(__dirname, '..', 'dist', 'ngrx-entity-crud', 'fesm2022')
);

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) {
      return (pa[i] || 0) - (pb[i] || 0);
    }
  }
  return 0;
}

function check(code) {
  // Solo codice e template: i commenti (JSDoc) citano apposta i nomi vietati.
  const src = code.replace(/\/\*[\s\S]*?\*\//g, '');
  const problems = [];

  for (const [, version] of src.matchAll(/minVersion: "([0-9.]+)"/g)) {
    if (compareVersions(version, MAX_MIN_VERSION) > 0) {
      problems.push(`minVersion ${version} > ${MAX_MIN_VERSION}`);
    }
  }
  for (const [match] of src.matchAll(
    /ChangeDetectionStrategy\.(Eager|Default)\b/g
  )) {
    problems.push(`${match}: usare ChangeDetectionStrategy.OnPush`);
  }
  if (src.includes('$safeNavigationMigration')) {
    problems.push('$safeNavigationMigration nei template');
  }
  for (const [, tag] of src.matchAll(DIVERGENT_PRIMENG_TAG)) {
    problems.push(`<${tag}>: selettore diverso tra PrimeNG 16 e 22`);
  }
  for (const [tag] of src.matchAll(
    /<ng-template\b[^>]*\bpTemplate="[^"]+"[^>]*>/g
  )) {
    const name = tag.match(/\bpTemplate="([^"]+)"/)[1];
    if (
      !TREE_NODE_TEMPLATES.has(name) &&
      !new RegExp(`#${name}\\b`).test(tag)
    ) {
      problems.push(
        `${tag}: manca #${name} (PrimeNG 22 legge solo i template ref)`
      );
    }
  }
  return problems;
}

if (!fs.existsSync(dir)) {
  console.error(
    `check-compat: cartella non trovata: ${dir} (eseguire prima la build)`
  );
  process.exit(1);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mjs'));
let failed = false;
for (const file of files) {
  const problems = check(fs.readFileSync(path.join(dir, file), 'utf8'));
  for (const problem of problems) {
    console.error(`check-compat: ${file}: ${problem}`);
  }
  failed = failed || problems.length > 0;
}

if (failed) {
  console.error(
    'check-compat: il pacchetto non sarebbe più linkabile/funzionante su Angular 16 + PrimeNG 16.'
  );
  process.exit(1);
}
console.log(
  `check-compat: ${files.length} bundle compatibili con Angular 16 + PrimeNG 16.`
);
