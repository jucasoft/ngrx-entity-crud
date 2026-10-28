# Migrazione Angular 22 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** portare workspace e libreria `ngrx-entity-crud` all'ultima versione di Angular (22.2) e di tutte le altre dipendenze, mantenendo funzionante l'app consumer Angular 16.2 + PrimeNG 16.

**Architecture:** migrazione a gradini (Angular 20 → 21 → 22) via `nx migrate`, un commit per gradino; prima della migrazione un refactor dei template PrimeNG che li rende compatibili sia con PrimeNG 16-21 sia con PrimeNG 22; uno script di guardia sul `dist` impedisce regressioni di compatibilità.

**Tech Stack:** Nx 24.0, Angular 22.2, NgRx 22.0, PrimeNG 22.1, TypeScript 6.0 (Angular 22 non supporta TS 7), Jest 30 + jest-preset-angular 17, angular-eslint 22, ESLint 10, Prettier 3, lint-staged 17, Node 24.22.1.

**Spec:** decisioni concordate in chat il 2026-10-28 (default accettati: compatibilità 16 mantenuta, markup proprio al posto dei 4 componenti PrimeNG divergenti, branch `22.0.0-beta` con versione `22.0.0-beta.0`, Node installato in `C:\dev\kit\node-v24.22.1-win-x64`).

## Global Constraints

- Il `dist` deve restare linkabile da Angular 16.2: ogni `minVersion` nei FESM ≤ `14.0.0`.
- Niente control-flow (`@if`/`@for`/`@switch`/`@defer`), niente `input()`/`model()`/`output()`/query signal nei componenti della libreria.
- Niente `ChangeDetectionStrategy.Default`/`Eager` nei componenti della libreria (Angular 22 emette `.Eager`, sconosciuto al linker v16): solo `OnPush`.
- Niente `$safeNavigationMigration(...)` nei template della libreria (la migrazione v22 `safe-optional-chaining` va scartata).
- PrimeNG: solo classi con nome identico in 16.9.1 e 22.1.4 (verificate: `ButtonDirective`, `Card`, `Checkbox`, `Divider`, `InputText`, `PrimeTemplate`, `SortableColumn`, `Table`, `Tag`, `Tree`, `DynamicDialogConfig`, `DynamicDialogRef` + relativi `*Module`).
- VIETATI i tag con selettore divergente v16↔v22: `p-sortIcon`, `p-tableCheckbox`, `p-tableHeaderCheckbox`, `p-progressBar` (e le forme kebab/minuscole).
- Ogni `<ng-template pTemplate="x">` usato da `p-table`/`p-card` porta anche `#x` (v22 legge solo i template ref); `p-tree` ha i template per tipo `pTemplate` (v16-21) + un unico `#node` (v22).
- I template degli schematic (`libs/ngrx-entity-crud/schematics/*/files/**`) non devono essere toccati dalle migrazioni (generano codice per app Angular 16).
- Versione: solo `libs/ngrx-entity-crud/package.json` → `22.0.0-beta.0`; niente tag, push o publish.
- Comandi con Node 24.22.1: prefisso `export PATH="/c/dev/kit/node-v24.22.1-win-x64:$PATH"`.

## Review Focus

- App Angular 16 che builda il `dist`: deve linkare senza errori → `scripts/check-compat.js` + build reale nel testbed `C:\VCS\ng16ForMigrationTestTo19` (Task 8).
- Tabelle/albero della dashboard su PrimeNG 16 (runtime) e 22 (Jest): righe, icone sort e nodi devono comparire → test DOM nei Task 1-2, ri-eseguiti dopo il Task 5.
- Selezione nei dialog form-clipboard (tutti/nessuno/parziale) → test nel Task 2.
- Schematic compilati con TS 6 caricati da una CLI Angular 16 (CommonJS, import `typescript`) → `build:schematics` + spec `SchematicTestRunner` esistenti.
- Migrazioni automatiche che riscrivono `files/` o introducono control-flow → `git diff --stat -- '*/files/*'` vuoto a ogni gradino.

---

### Task 0: Ambiente e baseline

- [ ] Node 24.22.1 estratto in `C:\dev\kit` (checksum verificato), worktree `.worktrees/22.0.0-beta` sul branch `22.0.0-beta` da `19.4.0-beta`, `npm ci`.
- [ ] Baseline: `npx nx test ngrx-entity-crud`, `npm run build`, `npx nx lint ngrx-entity-crud` verdi.

### Task 1: Dashboard e scaffold compatibili PrimeNG 16↔22

**Files:** Modify `libs/ngrx-entity-crud/devtools/nec-dashboard.component.ts`, `libs/ngrx-entity-crud/devtools/nec-scaffold.component.ts`; Create `libs/ngrx-entity-crud/devtools/sort-icon.ts`; Test `libs/ngrx-entity-crud/devtools/sort-icon.spec.ts`, `libs/ngrx-entity-crud/devtools/nec-dashboard.component.spec.ts`.

**Interfaces:** Produces `necSortIconClass(table: {sortField?: string | null; sortOrder?: number}, field: string): 'pi-sort-alt' | 'pi-sort-amount-up-alt' | 'pi-sort-amount-down'` (stessa logica del `SortIcon` PrimeNG 16: campo diverso → `pi-sort-alt`, `sortOrder === -1` → down, altrimenti up).

- [ ] Test `sort-icon.spec.ts`: campo non ordinato → `pi-sort-alt`; `{sortField:'key', sortOrder:1}` → `pi-sort-amount-up-alt`; `sortOrder:-1` → `pi-sort-amount-down`. Eseguire: FAIL (modulo assente).
- [ ] Test dashboard: nessun elemento `p-sorticon`/`p-progressbar` nel DOM; tabella localStorage con icona `pi-sort-amount-down` su `bytesUtf16` e `pi-sort-alt` sulle altre; dopo click su `th[psortablecolumn="key"]` icona `pi-sort-amount-up-alt` su `key`; barra quota `.nec-progress-value` con `width` = percentuale e testo `NN%`; nodi dell'albero IndexedDB resi per tipo. FAIL atteso.
- [ ] Implementare: `<i class="pi nec-sort-icon p-sortable-column-icon p-datatable-sort-icon" [ngClass]="sortIcon(ref, 'campo')">` al posto di ogni `p-sortIcon` (ref distinti per tabella); barra `.nec-progress` con CSS a doppio fallback `var(--x, var(--p-x, #hex))` al posto di `p-progressBar` (via `ProgressBarModule`); `#header`/`#body` accanto a ogni `pTemplate`; `p-tree`: un template `#idbNode` con `ngSwitch` su `node.type`, richiamato da `#node` e dai 4 `pTemplate` per tipo; aggiornare il JSDoc del vincolo PrimeNG.
- [ ] Test verdi, `npm run build` verde, commit `refactor(devtools): PrimeNG 16-22 compatible templates`.

### Task 2: Dialog form-clipboard senza checkbox di tabella

**Files:** Modify `libs/ngrx-entity-crud/form-clipboard/nec-form-data-export-dialog.component.ts`, `libs/ngrx-entity-crud/form-clipboard/nec-form-data-import-dialog.component.ts`; Create `libs/ngrx-entity-crud/form-clipboard/selection.ts`; Test `libs/ngrx-entity-crud/form-clipboard/selection.spec.ts`, `libs/ngrx-entity-crud/form-clipboard/nec-form-clipboard.dialogs.spec.ts`.

**Interfaces:** Produces `necToggleItem<T>(all: readonly T[], selection: readonly T[], item: T): T[]`, `necToggleAll<T>(all: readonly T[], selection: readonly T[]): T[]`, `necAllSelected<T>(all: readonly T[], selection: readonly T[]): boolean` — l'ordine del risultato segue sempre `all`.

- [ ] Test `selection.spec.ts`: toggle deseleziona/riseleziona mantenendo l'ordine di `all`; toggleAll con tutto selezionato → `[]`, altrimenti copia di `all`; `necAllSelected([], [])` → `false`. FAIL atteso.
- [ ] Test dialog: header + una `p-checkbox` per riga, nessun `p-tablecheckbox`/`p-tableheadercheckbox`; `triggerEventHandler('onChange', …)` sulla checkbox di riga toglie il campo dalla selezione (e dal JSON in export); sull'header alterna nessuno/tutti. FAIL atteso.
- [ ] Implementare con `p-checkbox [binary]="true" [ngModel]="…" (onChange)="…"` (`CheckboxModule` + `FormsModule`), togliendo `[(selection)]`/`dataKey` dalla `p-table`; `#header`/`#body` accanto ai `pTemplate`.
- [ ] Test verdi, build verde, commit `refactor(form-clipboard): PrimeNG 16-22 compatible row selection`.

### Task 3: Guardia di compatibilità sul dist

**Files:** Create `scripts/check-compat.js`; Modify `package.json` (script `build` → aggiunge `&& node scripts/check-compat.js`).

- [ ] Lo script legge `dist/ngrx-entity-crud/fesm2022/*.mjs` ed esce con codice 1 elencando file e motivo se trova: `minVersion` > `14.0.0`; `ChangeDetectionStrategy.Eager` o `.Default`; `$safeNavigationMigration`; tag `<p-sortIcon|p-tableCheckbox|p-tableHeaderCheckbox|p-progressBar>` (case-insensitive, anche kebab); `<ng-template … pTemplate="x"` senza `#x`, esclusi i template per tipo del `p-tree` (`store`/`record`/`value`/`note`).
- [ ] Verifica negativa: copia di un FESM con `minVersion: "17.0.0"` in una cartella temporanea passata come argomento → exit 1; sul dist reale → exit 0.
- [ ] Commit `build: guard Angular 16 / PrimeNG 16 compatibility of the dist`.

### Task 4: Gradino Angular 20

- [ ] `npx nx migrate @angular/core@20.3 && npx nx migrate @angular/cli@20.3` (più `@ngrx/store@20`, `angular-eslint@20` se Nx non li ha già allineati); `primeng@20.4.0`, `@angular/cdk@20.2`, TypeScript `~5.9`; rimuovere da `migrations.json` ogni `control-flow-migration`; `npm install` e `npx nx migrate --run-migrations`.
- [ ] `git diff --stat -- 'libs/ngrx-entity-crud/schematics/*/files/*'` vuoto (altrimenti `git checkout` di quei file); nessun `@if`/`@for` introdotto.
- [ ] Test, build (con guardia) e lint verdi; commit `chore: migrate to Angular 20`.

### Task 5: Gradino Angular 21

- [ ] Come il Task 4 con Nx 22.6, Angular 21.2, NgRx 21, angular-eslint 21, PrimeNG 21.1.10, cdk 21.2, zone.js 0.16, Jest 30 + jest-preset-angular 16 (dai `packageJsonUpdates` di Nx); **scartare `control-flow-migration` (in v21 non è opzionale)**.
- [ ] Stesse verifiche; commit `chore: migrate to Angular 21`.

### Task 6: Gradino Angular 22 + TypeScript 6

- [ ] `npx nx migrate latest` (Nx 24.0.2, Angular 22, NgRx 22, angular-eslint 22.5+, jest-preset-angular 17, TS 6.0); poi Angular `~22.2`, PrimeNG `22.1.4`, cdk 22; scartare `safe-optional-chaining` sui template della libreria; `change-detection-eager` ammessa solo sugli spec.
- [ ] tsconfig per TS 6: togliere `baseUrl` e `downlevelIteration`, `moduleResolution` → `bundler` (schematics: valore accettato da TS 6 con `module: commonjs`), `strict: false` esplicito dove assente, togliere `enableIvy`/opzioni View Engine; verificare `typescript/lib/tsserverlibrary` (in alternativa import da `typescript`).
- [ ] Jest: verificare resolver/`setup-env` di jest-preset-angular 17 e `transformIgnorePatterns` (`@primeicons`, `@primeui`).
- [ ] Test, build (con guardia), lint verdi; nel dist nessun `Eager`; commit `chore: migrate to Angular 22 and TypeScript 6`.

### Task 7: Altre dipendenze all'ultima versione + peerDependencies + documentazione

- [ ] `npx npm-check-updates`-equivalente manuale: ESLint 10 + `@eslint/js` 10, typescript-eslint, eslint-config-prettier, Prettier 3, lint-staged 17, `@swc/*`, `@types/jest`, fake-indexeddb, primeicons 8, tslib, rxjs 7.8.2, autoprefixer/postcss; regole ESLint di formattazione rimosse in v10 → sostituzione equivalente o rimozione motivata.
- [ ] `libs/ngrx-entity-crud/package.json`: peer Angular/NgRx/devkit estese con `^20.0.0 || ^21.0.0 || ^22.0.0`.
- [ ] CHANGELOG (voce 22.0.0-beta.0), CLAUDE.md/AGENTS.md (Node ≥ 24.15 / 22.22.3, vincoli PrimeNG 22), JSDoc dei componenti.
- [ ] `npm run format:check`, lint, test, build verdi; commit `chore: update remaining dependencies to latest`.

### Task 8: Verifica end-to-end su Angular 16

- [ ] Backup di `C:\VCS\ng16ForMigrationTestTo19\node_modules\ngrx-entity-crud`, `node scripts/link-copy.js C:\VCS\ng16ForMigrationTestTo19`, `rm -rf .angular/cache`, `npx ng build` (configurazione di sviluppo) nel testbed: deve completare senza errori di linking; poi ripristino del backup.

### Task 9: Bump versione

- [ ] `libs/ngrx-entity-crud/package.json` → `22.0.0-beta.0`, commit `v22.0.0-beta.0` (nessun tag, nessun push).
