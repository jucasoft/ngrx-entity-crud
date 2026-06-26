# ngrx-entity-crud
This library helps create the CRUD Angular application that makes use of NgRx.
Commands for code generation:
 - `store`: Generates a feature set containing an `entity`, `actions`, `reducer`, ... file.
 - `section`: Generates a new Angular CRUD page containing an `list`, `detail`, `search`, ... file.
 - `auth`: Generates a boilerplate for authentication implementation containing an `store section` and `components` file.
 - `lazy-report`: Scans the project and reports which stores are good candidates to become lazy.

# How to use it?
To create your first project, follow this [guide](https://github.com/jucasoft/ngrx-entity-crud-prime-ng-boilerplate).

# Command detail for generation

## store   

---

### Overview

Generates a feature set containing an `actions`, `effects`, `reducer`, and `selectors` file. You use this to build out a new feature area that provides a new piece of state.

### Command

```sh
ng generate ngrx-entity-crud:store  [options]
```

### Options

Name of the store section
- `--name`
  - Type: `string`
  - Default: `false`

Name of the class that will be managed 
- `--clazz`
  - Type: `string`
  - Default: `false`

Store type:
  - CRUD-PLURAL: generate action, effect and reducer for the crud management of the entity.
  - CRUD-SINGULAR: generate action, effect and reducer for the crud management of the entity.
  - CRUD+GRAPHQL: generate action, effect and reducer for the crud management of the entity.
  - BASE: generate an empty boilerplate
  

- `--type`
  - Type: `string`
  - Enum: `"CRUD-PLURAL", "CRUD-SINGULAR", "CRUD+GRAPHQL", "BASE"`
  - Default: `false`

Store registration strategy:
  - `eager`: the store is declared in the application `RootStoreModule` (historical behavior); reducers/effects are loaded at startup.
  - `lazy`: the store is **not** registered in the root; the view feature module is responsible for importing `<Clazz>StoreModule`, so reducers/effects are loaded only when the section is opened.

- `--registration`
  - Type: `string`
  - Enum: `"eager", "lazy"`
  - Optional. If omitted, the schematic asks interactively. In non-interactive runs (CI/scripts) it falls back to `eager`, so existing pipelines keep working unchanged.

> **Lazy mode notes**
> - With `--registration=lazy` nothing registers the store automatically: you must import `<Clazz>StoreModule` in the feature module generated for the view (e.g. `coin.module.ts`).
> - The generated slice is declared as **optional** in `root-store/state.ts`, because it does not exist in the runtime state until the section is loaded.
> - `root-store/selectors.ts` exposes the global loading/error selectors (`selectIsLoading`, `selectError`, `selectLoadingNames`) in a **store-agnostic** way: they scan the root state using the `EntityCrudBaseState` convention (every CRUD slice exposes `isLoading`/`error` at the top level), so lazily-registered stores contribute to the global loading/error state without coupling the root to any specific domain.

#### Examples

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD-PLURAL --registration=lazy
```
With `--registration=lazy` the store is not added to `RootStoreModule`; remember to import `CoinStoreModule` in the view feature module.


```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD-PLURAL
```
<details><summary>Show files generated/changed</summary>

```shell
CREATE src/app/main/models/vo/coin.ts (221 bytes)
CREATE src/app/root-store/coin-store/coin-store.module.ts (807 bytes)
CREATE src/app/root-store/coin-store/coin.actions.ts (779 bytes)
CREATE src/app/root-store/coin-store/coin.effects.ts (3184 bytes)
CREATE src/app/root-store/coin-store/coin.names.ts (46 bytes)
CREATE src/app/root-store/coin-store/coin.reducer.ts (2045 bytes)
CREATE src/app/root-store/coin-store/coin.selectors.ts (673 bytes)
CREATE src/app/root-store/coin-store/coin.state.ts (385 bytes)
CREATE src/app/root-store/coin-store/index.d.ts (282 bytes)
CREATE src/app/root-store/coin-store/index.ts (284 bytes)
CREATE src/app/main/services/coin.service.ts (344 bytes)

UPDATE src/app/root-store/index.ts (309 bytes)
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/state.ts (217 bytes)
UPDATE src/app/root-store/selectors.ts (665 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)

```
</details>

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD-SINGULAR
```
<details><summary>Show files generated/changed</summary>

```shell
CREATE src/app/main/models/vo/coin.ts (221 bytes)
CREATE src/app/root-store/coin-store/coin-store.module.ts (827 bytes)
CREATE src/app/root-store/coin-store/coin.actions.ts (524 bytes)
CREATE src/app/root-store/coin-store/coin.effects.ts (1470 bytes)
CREATE src/app/root-store/coin-store/coin.names.ts (46 bytes)
CREATE src/app/root-store/coin-store/coin.reducer.ts (1015 bytes)
CREATE src/app/root-store/coin-store/coin.selectors.ts (516 bytes)
CREATE src/app/root-store/coin-store/coin.state.ts (257 bytes)
CREATE src/app/root-store/coin-store/index.d.ts (282 bytes)
CREATE src/app/root-store/coin-store/index.ts (282 bytes)
CREATE src/app/main/services/coin.service.ts (360 bytes)

UPDATE src/app/root-store/index.ts (309 bytes)
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/state.ts (217 bytes)
UPDATE src/app/root-store/selectors.ts (665 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)

```
</details>

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD+GRAPHQL
```
<details><summary>Show files generated/changed</summary>

</details>

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=BASE
```
<details><summary>Show files generated/changed</summary>

```shell
CREATE src/app/root-store/coin-store/coin-store.module.ts (807 bytes)
CREATE src/app/root-store/coin-store/coin.actions.ts (319 bytes)
CREATE src/app/root-store/coin-store/coin.effects.ts (190 bytes)
CREATE src/app/root-store/coin-store/coin.names.ts (46 bytes)
CREATE src/app/root-store/coin-store/coin.reducer.ts (337 bytes)
CREATE src/app/root-store/coin-store/coin.selectors.ts (593 bytes)
CREATE src/app/root-store/coin-store/coin.state.ts (116 bytes)
CREATE src/app/root-store/coin-store/index.d.ts (282 bytes)
CREATE src/app/root-store/coin-store/index.ts (282 bytes)
CREATE src/app/main/models/vo/coin.ts (137 bytes)

UPDATE src/app/root-store/index.ts (309 bytes)
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/state.ts (184 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)
```
</details>

#### Files generated/changed by the “:store” command

## section

---

### Overview

Generates a new Angular CRUD page containing an `table`, `detail`, `search`, `reactive form`, ... file.

### Command

```sh
ng generate ngrx-entity-crud:section  [options]
```

### Options

Name of the class that will be managed
- `--clazz`
  - Type: `string`
  - Default: `false`

Allows you to decide whether to use the graphic components of PrimeNg, or to create an empty boilerplate
- `--lib`
  - Type: `string`
  - Enum: `"primeng" or "no-libs"`
  - Default: `true`

#### Examples

```sh
ng generate ngrx-entity-crud:section --clazz=Coin --lib=primeng
```

or

```sh
ng generate ngrx-entity-crud:section --clazz=Coin --lib=no-libs
```

#### Files generated/changed by the “:section” command

```sh
CREATE src/app/main/views/coin/coin-routing.module.ts (722 bytes)
CREATE src/app/main/views/coin/coin.module.ts (1102 bytes)
CREATE src/app/main/views/coin/coin-edit/coin-edit.component.html (1325 bytes)
CREATE src/app/main/views/coin/coin-edit/coin-edit.component.ts (1626 bytes)
CREATE src/app/main/views/coin/coin-list/coin-list.component.html (706 bytes)
CREATE src/app/main/views/coin/coin-list/coin-list.component.ts (2254 bytes)
CREATE src/app/main/views/coin/coin-main/coin-main.component.html (188 bytes)
CREATE src/app/main/views/coin/coin-main/coin-main.component.ts (536 bytes)

UPDATE src/app/app-routing.module.ts (517 bytes)
```

## auth

---

### Overview

Generates a boilerplate for authentication implementation containing an `store section` and `components` file.

### Command

```sh
ng generate ngrx-entity-crud:auth
```

#### Examples

```sh
ng generate ngrx-entity-crud:auth
```

#### Files generated/changed by the “:auth” command

```sh
CREATE src/app/main/views/login/login-routing.module.ts (546 bytes)
CREATE src/app/main/views/login/login.module.ts (819 bytes)
CREATE src/app/main/views/login/components/logout-button/logout-button.component.ts (1158 bytes)
CREATE src/app/main/views/login/login-main/login-main.component.html (1074 bytes)
CREATE src/app/main/views/login/login-main/login-main.component.ts (1590 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.actions.ts (1148 bytes)
CREATE src/app/root-store/auth-store/auth-mock.service.ts (2021 bytes)
CREATE src/app/root-store/auth-store/auth-store.module.ts (1017 bytes)
CREATE src/app/root-store/auth-store/auth.guard.ts (1359 bytes)
CREATE src/app/root-store/auth-store/auth.service.ts (731 bytes)
CREATE src/app/root-store/auth-store/conf.ts (76 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.effects.ts (1503 bytes)
CREATE src/app/root-store/auth-store/index.d.ts (271 bytes)
CREATE src/app/root-store/auth-store/index.ts (271 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.names.ts (47 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.reducer.ts (731 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.selectors.ts (1525 bytes)
CREATE src/app/root-store/auth-store/__clazz@dasherize__.state.ts (319 bytes)
CREATE src/app/main/models/vo/auth.ts (277 bytes)

UPDATE src/app/app-routing.module.ts (558 bytes)
UPDATE src/app/root-store/index.ts (309 bytes)
UPDATE src/app/root-store/index.d.ts (309 bytes)
UPDATE src/app/root-store/__clazz@dasherize__.state.ts (184 bytes)
UPDATE src/app/root-store/root-store.module.ts (1051 bytes)
```

## lazy-report

---

### Overview

Read-only analysis command. It scans the project and produces a report that maps each store to
the sections that use it, then suggests which stores are good candidates to be registered as
**lazy** (see the `--registration` option of the `store` command). Nothing is modified except the
generated report file: you decide what to convert.

How a store is classified:
- **candidato lazy**: used by exactly one section, and that section is on a lazy route (`loadChildren`).
- **multi-sezione**: used by more than one section (evaluate a shared lazy module).
- **tieni eager (usato dalla shell)**: referenced by the app shell (`core/`, `main/components`, `app.component`) — must stay eager.
- **sezione non lazy-routed**: its only section is loaded eagerly, so going lazy gives little benefit.
- **infra (eager)**: infrastructure store (e.g. `router-store`), excluded from candidates.
- **orfano**: not referenced by any section.

The scan is static and relies on the naming convention (`XxxStoreActions/Selectors/State/Module`).
Paths are read from `ngrx-entity-crud.conf.json` when present, otherwise defaults are used
(`src/app/root-store`, `src/app/main/views`, `src/app`).

### Command

```sh
ng generate ngrx-entity-crud:lazy-report [options]
```

### Options

Report file to write (relative to the workspace root); empty string = console only.
- `--output`
  - Type: `string`
  - Default: `lazy-report.md`

Format of the written report.
- `--format`
  - Type: `string`
  - Enum: `"md", "json"`
  - Default: `md`

Infrastructure stores excluded from lazy candidates (folder names).
- `--infra-stores`
  - Type: `string[]`
  - Default: `["router-store"]`

Include detected persistence providers (localStorage/IndexedDB) from `package.json` in the report.
- `--storage`
  - Type: `boolean`
  - Default: `true`

The JSON report (`--format=json`) also includes a top-level `generatedAt` (ISO timestamp, for
staleness detection) and, per store, the structured booleans `lazyRoute` and `isLazyCandidate`
(so tools can correlate without parsing the textual `verdict`). When `--storage` is enabled it
adds a `storage` object `{ providers, source }`. The `{ paths, stores }` shape is unchanged
(additive, backward-compatible).

#### Examples

```sh
ng generate ngrx-entity-crud:lazy-report
ng generate ngrx-entity-crud:lazy-report --format=json --output=lazy-report.json
ng generate ngrx-entity-crud:lazy-report --output=        # solo console
```

Example output (excerpt):

```md
| store | clazz | type | sezioni | n | lazy route | shell | verdetto |
|---|---|---|---|---|---|---|---|
| coin-store | Coin | CRUD-PLURAL | coin | 1 | si | no | candidato lazy |
| currency-store | Currency | CRUD-PLURAL | coin, invoice | 2 | si | no | multi-sezione (2) -> valuta modulo condiviso |
| menu-store | Menu | CRUD-PLURAL | - | 0 | - | si | tieni eager (usato dalla shell) |
```

## dashboard

---

### Overview

Scaffolds a **project dashboard** view with three runtime summaries: localStorage usage,
IndexedDB usage (agnostic to the persistence library you use), and NgRx stores + lazy-loading
candidates. The generated module is a thin PrimeNG wrapper that hosts `<nec-dashboard>`, the
standalone component exported by the secondary entry-point `ngrx-entity-crud/devtools`; all the
diagnostic logic lives in the library (versioned and tested), not in generated code.

By default it also generates `src/assets/lazy-report.json` (reusing `lazy-report --format=json`),
which the dashboard reads at runtime to correlate the loaded/lazy state of each store.

The dashboard can run in **production**: by default it shows only keys, sizes and counts — never
raw values. Value reveal is opt-in (`[allowRevealValues]="true"`) and always masks sensitive
patterns (token/JWT/email/secret); keys that look sensitive are flagged.

### Command

```sh
ng generate ngrx-entity-crud:dashboard [options]
```

### Options

Feature name (drives the lazy route and the generated file names).
- `--clazz`
  - Type: `string`
  - Default: `Dashboard`

Generate the lazy-report JSON read by the dashboard.
- `--include-lazy-report`
  - Type: `boolean`
  - Default: `true`

Path of the generated lazy-report JSON.
- `--lazy-report-output`
  - Type: `string`
  - Default: `src/assets/lazy-report.json`

The name of the project.
- `--project`
  - Type: `string`

#### Using the standalone component directly

If you prefer not to scaffold, import the component from the secondary entry-point and mount it
anywhere (e.g. behind a dev-only route):

```ts
import { NecDashboardComponent } from 'ngrx-entity-crud/devtools';

@Component({
  standalone: true,
  imports: [NecDashboardComponent],
  template: `<nec-dashboard
    lazyReportUrl="assets/lazy-report.json"
    [idbDatabaseNames]="['NgRxStateStore']"
    [allowRevealValues]="false"
    [pollingMs]="0"
    (sliceReset)="onSliceReset($event)"></nec-dashboard>`,
})
export class DevPanelComponent {
  onSliceReset(sliceKey: string): void {
    // reactivity hook: a CRUD slice has just been reset to its initial state
  }
}
```

Inputs: `blacklist` / `whitelist` (`string[]`, filter store slices), `lazyReportUrl`
(default `assets/lazy-report.json`; empty string disables the static correlation),
`idbDatabaseNames` (`string[]`, DB names to inspect where `indexedDB.databases()` is unsupported —
Firefox / older Safari), `pollingMs` (`number`, auto-refresh; `0` = manual), `allowRevealValues`
(`boolean`, opt-in masked value reveal — gates both localStorage values and IndexedDB record
values), `idbEntryLimit` (`number`, default `50`, max records read per object store in the
IndexedDB tree).

Outputs: `sliceReset` (`EventEmitter<string>`) emits the slice key whenever a full `Reset` is
dispatched (including via the global **Azzera tutte** button).

Notes:
- The **Store NgRx** panel exposes per-row actions: **reset** dispatches the library's `Reset`
  action (`[key] Reset`), restoring the slice to its `initialState` (empty entities, selection,
  criteria and responses); **reset responses** dispatches the lighter `ResetResponses`
  (`[key] Reset Response`). A toolbar **Azzera tutte** button resets every listed slice at once.
  All three are destructive and require an inline two-step confirmation before dispatching.
  Because the slice key in the root state matches the action name by convention (the `store`
  schematic feeds the same `Names.NAME` to both `StoreModule.forFeature` and `createCrudActions`),
  the dashboard can target the right action from the slice key alone — no per-domain wiring needed.
  After a reset the dashboard refreshes its counts; if you persist the NgRx state (e.g. to
  IndexedDB), your persistence layer will write back the emptied state, clearing the local data.
- The **Store NgRx** panel has a toggle button: by default it lists every mounted slice, but
  **Mostra solo le slice con dati** filters down to slices that actually hold data (entities for
  `plural`, an `item` for `singular`, or cached responses).
- IndexedDB is introspected **agnostically** via native APIs (`indexedDB.databases()` + `count()`),
  with an optional `NEC_IDB_ADAPTER` injection token for custom providers. Byte sizes per
  record/store are not measurable; only record counts and the aggregate origin quota
  (`navigator.storage.estimate()`) are shown. The panel renders an **expandable tree** (database →
  object store → record): expanding an object store lazily reads up to `idbEntryLimit` records and
  lists their keys; with `[allowRevealValues]="true"` each record can be expanded further to show
  its value (serialized to JSON and masked for sensitive patterns).
- `<nec-dashboard>` is a standalone component built with the classic structural directives
  (`*ngIf`/`*ngFor`), so it stays compatible with Angular 14+ consumers; the main entry-point keeps
  the wider peer range.

## Running unit tests
Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Help
If you need help, or want to help me: [https://github.com/jucasoft/ngrx-entity-crud/issues](https://github.com/jucasoft/ngrx-entity-crud/issues)

## MIT License

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
