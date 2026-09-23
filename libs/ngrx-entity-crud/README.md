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

Local persistence (search results + drafts saved to IndexedDB, see the
[`ngrx-entity-crud/persistence`](#secondary-entry-point-ngrx-entity-crudpersistence) section below).
For `--type=CRUD-PLURAL` the wiring is **always generated**, switched off by default:
  - `<clazz>.persistence.ts` exports `<Clazz>Persistence = createPersistence<Clazz>({..., enabled})`,
    registered in `<clazz>-store.module.ts` (`StoreModule.forFeature` + `EffectsModule.forFeature`,
    same registration point for eager and lazy stores) and exported from the store `index.ts`;
  - with `enabled: false` nothing touches IndexedDB; to turn it on later change only that value;
  - the other types don't have `entitiesSelected`/`Restore*`: the flag is ignored, with a warning in
    the schematic log.

- `--persist`
  - Type: `boolean`
  - Default: `false`
  - Sets `enabled: true` in `<clazz>.persistence.ts`; without it the wiring is there but off.

#### Examples

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD-PLURAL --registration=lazy
```
With `--registration=lazy` the store is not added to `RootStoreModule`; remember to import `CoinStoreModule` in the view feature module.

```sh
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD-PLURAL --persist=true
```
Same files as without the flag, with `enabled: true` in `coin.persistence.ts`. Sections generated
by `ng generate ngrx-entity-crud:section` already wrap the search with `<nec-restore-search>`; for
sections generated before this version use the
[`persistence`](#adding-persistence-to-an-existing-section) schematic.


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
- **lazy candidate**: used by exactly one section, and that section is on a lazy route (`loadChildren`).
- **multi-section**: used by more than one section (evaluate a shared lazy module).
- **keep eager (used by the shell)**: referenced by the app shell (`core/`, `main/components`, `app.component`) — must stay eager.
- **section not lazy-routed**: its only section is loaded eagerly, so going lazy gives little benefit.
- **infra (eager)**: infrastructure store (e.g. `router-store`), excluded from candidates.
- **orphan**: not referenced by any section.

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
  - Default: `lazy-report.<format>` (`lazy-report.md` or `lazy-report.json`)

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
ng generate ngrx-entity-crud:lazy-report --format=json    # scrive lazy-report.json
ng generate ngrx-entity-crud:lazy-report --output=        # solo console
```

Example output (excerpt):

```md
| store | clazz | type | sections | n | lazy route | shell | verdict |
|---|---|---|---|---|---|---|---|
| coin-store | Coin | CRUD-PLURAL | coin | 1 | yes | no | lazy candidate |
| currency-store | Currency | CRUD-PLURAL | coin, invoice | 2 | yes | no | multi-section (2) -> consider a shared module |
| menu-store | Menu | CRUD-PLURAL | - | 0 | - | yes | keep eager (used by the shell) |
```

## table-report

---

### Overview

Read-only analysis command. It scans the whole app source (`.ts` **and** `.html`, inline templates
included) and produces an inventory of every data table: **ag-Grid** (`<ag-grid-angular>`, both the
bare `ag-grid-*` packages and the modular `@ag-grid-community/*` / `@ag-grid-enterprise/*` ones)
and **PrimeNG `p-table`** (the kind generated by the `section` schematic). Nothing is modified
except the generated report file.

For each grid it reports:
- the component, its selector, template kind (inline/external) and location (section under the
  views path, `core`, shell);
- the **columns extracted from the TypeScript AST** of `columnDefs` (both class-property
  initializers and `this.columnDefs = [...]` assignments): `field`, `headerName` and every other
  property name (e.g. `suppressExport`, `valueFormatterExcel`); spread/computed entries are counted
  as dynamic; the declared column type (e.g. `CustomColDef`) is included;
- the `defaultColDef` / `gridOptions` property names, the ag-Grid theme and the template bindings;
- the stores the component references (same `XxxStoreActions/Selectors/...` convention used by
  `lazy-report`), so each grid comes correlated with its NgRx slice;
- whether the grid is actually **referenced** (selector/class used outside the component, comments
  stripped; a grid reachable only through a module nobody imports is flagged as `orphan?`);
- the ag-Grid / PrimeNG packages found in `package.json`, with versions (useful when planning
  AG Grid migrations).

Paths are read from `ngrx-entity-crud.conf.json` when present, otherwise defaults are used
(`src/app`, `src/app/main/views`, `src/app/root-store`).

### Command

```sh
ng generate ngrx-entity-crud:table-report [options]
```

### Options

Report file to write (relative to the workspace root); empty string = console only.
- `--output`
  - Type: `string`
  - Default: `table-report.<format>` (`table-report.md` or `table-report.json`)

Format of the written report.
- `--format`
  - Type: `string`
  - Enum: `"md", "json"`
  - Default: `md`

Include the per-column details extracted from the AST.
- `--columns`
  - Type: `boolean`
  - Default: `true`

Include PrimeNG `p-table` components (set to `false` for an ag-Grid-only report).
- `--p-table`
  - Type: `boolean`
  - Default: `true`

The JSON report (`--format=json`) includes a top-level `generatedAt` (ISO timestamp), a `summary`
(`grids`, `agGrid`, `pTable`, `orphans`, `agGridEnterprise`), the `packages` list and, per grid,
structured fields (`isOrphan`, `section`, `stores`, `columnsSource`, ...) so tools — e.g. a future
dashboard panel — can correlate without parsing the textual `verdict`.

#### Examples

```sh
ng generate ngrx-entity-crud:table-report
ng generate ngrx-entity-crud:table-report --format=json   # scrive table-report.json
ng generate ngrx-entity-crud:table-report --output=       # solo console
ng generate ngrx-entity-crud:table-report --p-table=false --columns=false
```

Example output (excerpt):

```md
| component | kind | where | template | stores | columns | referenced | verdict |
|---|---|---|---|---|---|---|---|
| ProductBrowserListComponent | ag-grid | views/product-browser | external | product-browser | 4 | yes | ok |
| ShowDiffDialogComponent | ag-grid | core/components/show-diff | inline | - | 4 | yes | ok |
| LogListComponent | ag-grid | core/components/log | inline | - | 5 | no | orphan? (not referenced by any used template/module) |
```

## dashboard

---

### Overview

Scaffolds a **project dashboard** view with four runtime summaries: localStorage usage,
IndexedDB usage (agnostic to the persistence library you use), NgRx stores + lazy-loading
candidates, and the project's data **tables** (ag-Grid / `p-table` inventory) — plus a
**Scaffold** panel (`<nec-scaffold>`) that builds the configuration file and the
`ng generate` commands for a new "search form + grid" section. The generated
module hosts `<nec-dashboard>`, the standalone component exported by the secondary entry-point
`ngrx-entity-crud/devtools`; all the diagnostic logic lives in the library (versioned and
tested), not in generated code.

`<nec-dashboard>` is built on **PrimeNG** components (`p-card`, `p-table`, `p-tag`, `p-tree`, the
`pButton` directive), so the `ngrx-entity-crud/devtools` entry-point requires `primeng` and
`primeicons` in your app (declared as **optional** peerDependencies — the core entry-point does
not need them). The component uses the `pButton` severity *classes* and the `success`/`info`/
`danger` tag severities, an idiom compatible with PrimeNG 16 (the consumer baseline) through the
later majors.

By default it also generates `src/assets/lazy-report.json` (reusing `lazy-report --format=json`),
which the dashboard reads at runtime to correlate the loaded/lazy state of each store, and
`src/assets/table-report.json` (reusing `table-report --format=json`), which feeds the **Tables**
panel: every grid in the project with its columns, the stores it references and whether those
slices are currently mounted.

The dashboard can run in **production**: by default it shows only keys, sizes and counts — never
raw values. Value reveal is opt-in (`[allowRevealValues]="true"`) and always masks sensitive
patterns (token/JWT/email/secret); keys that look sensitive are flagged. The only exception is
the **Python snippet** panel (opt-in via `pythonSnippetKeys`): it copies the RAW values of the
listed keys to the clipboard — they are needed to call the APIs from a script — while the
on-screen previews always mask them.

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

Generate the table-report JSON read by the Tables panel.
- `--include-table-report`
  - Type: `boolean`
  - Default: `true`

Path of the generated table-report JSON.
- `--table-report-output`
  - Type: `string`
  - Default: `src/assets/table-report.json`

The generated wrapper wires `lazyReportUrl` / `tableReportUrl` on `<nec-dashboard>` to the
output paths above (with the `src/` prefix stripped), so custom `--lazy-report-output` /
`--table-report-output` values are picked up automatically; a report disabled via
`--include-*-report=false` yields an empty URL, which turns that panel off.

Include the `<nec-scaffold>` panel in the generated wrapper.
- `--include-scaffold`
  - Type: `boolean`
  - Default: `true`

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
`tableReportUrl` (default `assets/table-report.json`; empty string hides the Tables panel),
`idbDatabaseNames` (`string[]`, DB names to inspect where `indexedDB.databases()` is unsupported —
Firefox / older Safari), `pollingMs` (`number`, auto-refresh; `0` = manual), `allowRevealValues`
(`boolean`, opt-in masked value reveal — gates both localStorage values and IndexedDB record
values), `idbEntryLimit` (`number`, default `50`, max records read per object store in the
IndexedDB tree), `pythonSnippetKeys` (`string[]`, default `[]` = feature hidden; localStorage
keys exported as variables in the Python snippet, e.g. `['access_token']` — the copied snippet
contains their RAW values), `apiBaseUrl` (`string`, base URL used in the Python snippet; defaults
to `location.origin`).

Outputs: `sliceReset` (`EventEmitter<string>`) emits the slice key whenever a full `Reset` is
dispatched (including via the global **Reset all** button).

Notes:
- The **Store NgRx** panel exposes per-row actions: **reset** dispatches the library's `Reset`
  action (`[key] Reset`), restoring the slice to its `initialState` (empty entities, selection,
  criteria and responses); **reset responses** dispatches the lighter `ResetResponses`
  (`[key] Reset Response`). A toolbar **Reset all** button resets every listed slice at once.
  All three are destructive and require an inline two-step confirmation before dispatching.
  Because the slice key in the root state matches the action name by convention (the `store`
  schematic feeds the same `Names.NAME` to both `StoreModule.forFeature` and `createCrudActions`),
  the dashboard can target the right action from the slice key alone — no per-domain wiring needed.
  After a reset the dashboard refreshes its counts; if you persist the NgRx state (e.g. to
  IndexedDB), your persistence layer will write back the emptied state, clearing the local data.
- The **NgRx store** panel has a toggle button: by default it lists every mounted slice, but
  **Show only slices with data** filters down to slices that actually hold data (entities for
  `plural`, an `item` for `singular`, or cached responses).
- With `pythonSnippetKeys` set, a dedicated **Python snippet** panel shows a masked preview of
  both codes about to be copied, each with its copy button: **Copy Python snippet** copies a
  ready-to-adapt `requests` script whose variables (`BASE_URL`, one `UPPER_SNAKE` variable per
  listed key, e.g. `ACCESS_TOKEN`) are read from localStorage; **Copy variables only** copies
  just the marker-delimited variables block, regenerated with the current values — when the token
  rotates, paste it over the stale block without touching the rest of the script. The previews
  always mask the values (`maskValue`); the RAW values go only to the clipboard.
- The **Tables** panel reads the static inventory produced by
  `ng generate ngrx-entity-crud:table-report --format=json --output=src/assets/table-report.json`:
  one row per grid (component, kind ag-Grid/p-table, location, referenced stores, statically
  extracted column count, verdict), with an `orphan` tag on grids not referenced by any used
  template/module. The **runtime** column correlates each grid's stores with the slices currently
  mounted (`loaded` / `partial` / `not-loaded`). Like the lazy report, the JSON is a snapshot:
  the panel shows its `generatedAt` and the command to regenerate it when stale.
- IndexedDB is introspected **agnostically** via native APIs (`indexedDB.databases()` + `count()`),
  with an optional `NEC_IDB_ADAPTER` injection token for custom providers. Byte sizes per
  record/store are not measurable; only record counts and the aggregate origin quota
  (`navigator.storage.estimate()`) are shown. The panel renders a PrimeNG `p-tree` (database →
  object store → record): expanding an object store **lazily** reads up to `idbEntryLimit` records
  and lists their keys; with `[allowRevealValues]="true"` each record can be expanded further to
  show its value (serialized to JSON and masked for sensitive patterns).
- The **Live grids** panel shows the ag-Grid instances that registered themselves at runtime —
  grid instances are not enumerable from the outside, so registration is explicit and opt-in
  (same principle as `NEC_IDB_ADAPTER`). Two lines in the consumer component:

  ```ts
  import { NecGridRegistryService } from 'ngrx-entity-crud/devtools';

  constructor(private gridRegistry: NecGridRegistryService) {}
  private gridUnregister?: () => void;

  onGridReady(params: GridReadyEvent): void {
    this.gridUnregister = this.gridRegistry.register('product-browser', params.api,
      { store: 'product_browser', component: 'ProductBrowserListComponent' });
  }
  ngOnDestroy(): void { this.gridUnregister?.(); }
  ```

  `register` takes any object structurally compatible with `NecGridHandle` (the `GridApi` of
  ag-Grid 31+ is; the library does NOT depend on ag-grid). The panel appears only when at least
  one grid is registered and shows, per grid: displayed rows vs the entities of the correlated
  slice (via the optional `store` meta — displayed < entities means filters are hiding rows),
  selected rows, active filter count, sorted columns, plus **autosize** / **clear filters** /
  **deselect** row actions. Every handle call is defensive: a missing or throwing method
  degrades to `–`, a destroyed grid (`isDestroyed()`) is evicted automatically even without
  unregister. Values refresh with the dashboard (manual or `pollingMs`).
- The **Scaffold** panel (`<nec-scaffold>`, its own standalone component, included in the
  generated wrapper unless `--include-scaffold=false`) assists the "new section" flow of the
  consumer schematics: type the entity name (live `classify`/`dasherize` preview, mirroring
  `@angular-devkit/core` so the file name matches what the view schematic resolves from
  `--clazz`), paste a sample DTO JSON returned by the backend (it becomes `dtoObject` and its
  fields are listed with the derived type), mark the key fields and the search conditions
  (`string`/`number`/`date`), and add search-only fields that do not exist in the DTO. The
  panel outputs the configuration JSON (`formAttributes`/`dtoObject`/`keys`/`conditionMap`)
  with copy/download buttons — the browser cannot write to disk: save it as
  `<confDir>/<dasherized>.json` — and the ordered `ng generate` commands with per-command copy.
  Inputs: `confDir` (default `grm-schematics/conf`), `storeSchematic` (default
  `ngrx-entity-crud:store`), `viewSchematic` (default `grm-schematics:view`), `apiSchematic`
  (default empty = hidden), `checklist` (`string[]`, manual post-generation steps; `[]` hides
  the list). An empty schematic name hides that command.
- `<nec-dashboard>` is a standalone component that imports PrimeNG modules and uses the classic
  structural directives (`*ngIf`/`*ngFor`), so it stays compatible with Angular 16+ consumers; the
  core entry-point keeps the wider peer range and has no PrimeNG dependency.

# Secondary entry-point: `ngrx-entity-crud/persistence`

---

Local persistence for CRUD sections, backed by IndexedDB: search results are saved as one block,
drafts (rows edited but not yet sent, stored in `entitiesSelected`) one record per entity — the two
have very different write profiles, so they're never rewritten together. Full design rationale in
[`ngrx-entity-crud-persistence-plan.md`](https://github.com/jucasoft/ngrx-entity-crud/blob/master/ngrx-entity-crud-persistence-plan.md)
at the repository root. Tree-shakable: importing it costs nothing to consumers who don't.

The entry-point is split in two, so that every store can import the store side without pulling
PrimeNG:
- `ngrx-entity-crud/persistence` — store side: `createPersistence`, service, actions, reducer,
  selectors, effects. No PrimeNG, no `ngrx-entity-crud/devtools`.
- `ngrx-entity-crud/persistence-ui` — `<nec-restore-search>` (PrimeNG `p-button`/`p-tag`) and the
  `<nec-dashboard>` adapter (`provideNecIdbAdapterFromPersistence`).

### Setup (optional)

The global configuration is optional: without it the defaults below apply.

```ts
import {NecPersistenceModule} from 'ngrx-entity-crud/persistence';

@NgModule({
  imports: [
    NecPersistenceModule.forRoot({
      // tutti i campi sono opzionali; questi sono i default.
      dbName: 'nec-persistence',
      dbVersion: 2,          // non fissarlo a 1: la versione 2 aggiunge lo store sectionPrefs
      debounceMs: 200,
      openTimeoutMs: 10000,  // oltre, l'apertura del DB fallisce e la chiamata successiva ritenta
      enabled: true,         // false spegne la persistenza di TUTTE le sezioni
      // autoRestore e' assente di default: il ripristino resta sempre un gesto esplicito
      // finche' non lo abiliti, qui (default globale) o per sezione (vedi sotto).
    }),
  ],
})
export class AppModule {}
```

On Angular 15+ you can use the functional variant instead: `provideNecPersistence({...})` in your
`ApplicationConfig`/`providers` array.

### Per-section wiring: `createPersistence`

One call per section creates everything once (the persistence actions, reducer, selectors and
effects) on the same feature as the store, so no `feature` string has to be repeated and kept in
sync by hand. Generated by the `store` schematic in `<clazz>.persistence.ts`:

```ts
import {createPersistence} from 'ngrx-entity-crud/persistence';
import {Coin} from '@models/vo/coin';
import {actions} from './coin.actions';
import {Names} from './coin.names';

export const CoinPersistence = createPersistence<Coin>({
  feature: Names.NAME,
  selectId: Coin.selectId,
  actions,
  enabled: false, // cablaggio presente ma spento: nessun accesso a IndexedDB
  // optional, overrides NecPersistenceModule.forRoot's global default for THIS section:
  // autoRestore: {maxAgeMs: 60 * 60 * 1000},
});
```

```ts
@NgModule({
  imports: [
    // ...
    StoreModule.forFeature(CoinPersistence.featureKey, CoinPersistence.reducer),
    EffectsModule.forFeature([CoinStoreEffects, CoinPersistence.effects]),
  ],
  providers: [CoinStoreEffects /* CoinPersistence.effects doesn't go in providers */],
})
export class CoinStoreModule {}
```

| Member | Notes |
| --- | --- |
| `feature` / `featureKey` | The store feature and the key of the persistence slice (`<feature>:persistence`). |
| `enabled` | `false`: effects are inert (no IndexedDB access at all) and `<nec-restore-search>` only renders its projected content. |
| `crudActions` | The section's CRUD actions (with `RestoreRequest/Success/Failure`). |
| `actions` | `SectionCheckSuccess`, `SetSectionSaveMode`, `InitialSearch`, e.g. `store.dispatch(CoinPersistence.actions.SetSectionSaveMode({mode: 'always'}))`. |
| `reducer` / `selectors` / `effects` | To register as shown above; `selectors.sectionCheck`, `selectors.saveMode`. |

Once enabled, the effects write on their own following the CRUD action lifecycle
(`SearchRequest` purges, the search block is saved with the first draft, or on every
`SearchSuccess` in `'always'` save mode, `AddManySelected`/`SelectItems` save drafts debounced,
deletions clean up the matching drafts): no further action dispatches needed. The moment the
section is created (same instant for eager and lazy stores) it also runs a lightweight freshness
check (`stats(feature)`, metadata only) and, if `autoRestore` applies, dispatches `RestoreRequest`
on its own.

**Searching when the section opens: `InitialSearch`.** A `SearchRequest` purges the section's local
data, so a list that searches in `ngOnInit` with `SearchRequest` would wipe the saved drafts on every
reload, before the user can restore them. Dispatch `InitialSearch` instead (same criteria):

```ts
ngOnInit(): void {
  this.store$.dispatch(CoinPersistence.actions.InitialSearch({queryParams: {}}));
}
```

It becomes a `SearchRequest` only when there's nothing to restore: no local data, a failed check, or
the local data was already searched over / restored earlier in the session (reopening the section).
When local data is waiting, no search starts: `autoRestore` restores it, or `<nec-restore-search>`
offers `Restore`/`New search`. With `enabled: false` it is a plain `SearchRequest`. The generated
list component uses it; a search the user starts (`<app-search>`) stays a `SearchRequest`.

The lower-level factories (`createPersistenceActions`, `createPersistenceReducer`,
`createPersistenceSelectors`, `createPersistenceEffects`) are still exported; `createPersistence`
is the recommended entry point.

### `<nec-restore-search>` (`ngrx-entity-crud/persistence-ui`)

Wraps the section's existing search button (pass it as projected content, it's left completely
untouched: building the search criteria is your form's job):

```ts
import {NecRestoreSearchComponent} from 'ngrx-entity-crud/persistence-ui'; // standalone: add it to the NgModule imports
import {CoinPersistence} from '@root-store/index';

export class CoinMainComponent {
  persistence = CoinPersistence;
}
```

```html
<nec-restore-search [persistence]="persistence">
  <app-search [actions]="actions"></app-search>
</nec-restore-search>
```

| Input | Type | Notes |
| --- | --- | --- |
| `persistence` | `NecPersistence<T>` | The object returned by `createPersistence`. With `enabled: false` the component is transparent: it only renders the projected content. |
| `quotaWarningThreshold` | `number` | Default `0.9`. Fraction of `storage.estimate()` above which the "storage almost full" tag appears. |
| `feature`, `selectors`, `actions` | | **Deprecated**, kept for sections wired with previous betas: use `[persistence]`. `feature` must match *exactly* the `feature` of the effects (an empty value logs a warning in dev mode). |

Only `p-button`/`p-tag` (identical classes across PrimeNG v16→v19; `primeng` stays an optional peer
dependency). When there's nothing saved locally it just renders the projected button; with local
data present it shows a summary (`"100 results saved, 12 unsent changes, 340 KB — yesterday 18:42"`)
with `Restore`/`New search` (inline Yes/Cancel confirmation, since it discards unsent work); if
`autoRestore` applies, the restore starts on its own with a spinner, no confirmation asked.

### Adding persistence to an existing section

Sections generated before this version have no `<clazz>.persistence.ts`. One command wires store
and UI:

```sh
ng generate ngrx-entity-crud:persistence --clazz=Coin              # wired, switched off
ng generate ngrx-entity-crud:persistence --clazz=Coin --enabled    # wired and on
ng generate ngrx-entity-crud:persistence --clazz=Coin --ui=false   # store only, no UI changes
```

It creates `coin.persistence.ts`, registers reducer/effects in `coin-store.module.ts`, exports
`CoinPersistence` from the store `index.ts` and (unless `--ui=false`) imports
`NecRestoreSearchComponent` in the section module, adds `persistence = CoinPersistence` to
`CoinMainComponent`, wraps `<app-search>` in its template and replaces the `SearchRequest` in
`CoinListComponent.ngOnInit` with `CoinPersistence.actions.InitialSearch`. Running it twice changes
nothing.

**Sections modified by hand.** Where the expected code isn't found (e.g. effects registered through
a constant instead of an array literal, a renamed main component, a custom search instead of
`<app-search>`, zero or several `SearchRequest` in the list's `ngOnInit`, the wiring of a previous beta with `createPersistenceEffects`), the schematic does
not guess: it leaves a marker that **does not compile** and lists it in the log.

```ts
// ngrx-entity-crud:persistence — PASSO MANUALE: registra CoinPersistence.effects in EffectsModule.forFeature.
// Questa riga non compila apposta: completa il passo a mano, poi cancellala.
NEC_PASSO_MANUALE__registra_CoinPersistence_effects_in_EffectsModule_forFeature;
```

`ng build` then fails exactly there (`TS2304: Cannot find name 'NEC_PASSO_MANUALE__...'` in `.ts`
files, `NG8001: 'nec-passo-manuale-...' is not a known element` in templates): the name says what to
do; complete the step and delete the marker.

### Dashboard integration (optional)

If you also use [`<nec-dashboard>`](#dashboard), this makes its IndexedDB panel show your sections
(names, saved/drafts counts) instead of relying only on the native fallback:

```ts
import {provideNecIdbAdapterFromPersistence} from 'ngrx-entity-crud/persistence-ui';

@NgModule({
  providers: [provideNecIdbAdapterFromPersistence()],
})
export class AppModule {}
```

# Secondary entry-point: `ngrx-entity-crud/ui`

---

### `<nec-defrag-loader>`

A busy indicator that replays the **Windows 98 Disk Defragmenter**: a map of clusters that
compacts towards the start of the disk, a blocky progress bar and the classic system chrome.
It is a plain presentational component — no NgRx, no PrimeNG, no dependency on the rest of
the library — so the entry-point stays tree-shakable and theme-independent.

The look is reconstructed from the original bitmaps, not from memory: 7x9 px boxes with a 1px
black frame and a 5x7 core, 1-pixel checkerboards where the original dithered, and the 16-colour
VGA palette. Note the colour semantics, which most remakes get backwards: the *before* map is
cyan/teal (unoptimized data, coloured by the part of the volume it belongs to), blue is what is
**already optimized**, green is a read and red is a write.

```ts
import { NecDefragLoaderComponent } from 'ngrx-entity-crud/ui';
```

**Indeterminate** (default) — the pass loops for as long as the operation runs:

```html
<nec-defrag-loader *ngIf="isLoading$ | async"></nec-defrag-loader>
```

**Determinate** — the real percentage drives the consolidation, so the grid is a faithful
reading of the progress:

```html
<nec-defrag-loader
  [title]="'Importing archive'"
  [status]="'Reading drive information...'"
  [progress]="uploadedPercent$ | async"
  [showLegend]="true"
></nec-defrag-loader>
```

**Full-page overlay** while a blocking operation runs:

```html
<nec-defrag-loader *ngIf="busy" [overlay]="true"></nec-defrag-loader>
```

| Input | Type | Default | Notes |
| --- | --- | --- | --- |
| `title` | `string` | `'Defragmenting Drive C'` | Title bar text, also the accessible label. |
| `status` | `string` | `''` | Status line under the grid; hidden when empty. |
| `progress` | `number \| null` | `null` | `0..100` switches to determinate mode; `null` loops. |
| `running` | `boolean` | `true` | Freezes the animation without unmounting. |
| `cols` / `rows` | `number` | `48` / `12` | Map size in clusters. |
| `cellWidth` / `cellHeight` | `number` | `7` / `9` | Native box size in px, black frame included — the original bitmap is taller than wide. |
| `scale` | `number` | `2` | Integer zoom; pixels stay crisp (no smoothing). |
| `density` | `number` | `0.62` | Share of the disk that starts out occupied. |
| `seed` | `number` | `1` | Same seed, same fragmentation (deterministic). |
| `clustersPerSecond` | `number` | `30` | Animation speed. |
| `showChrome` | `boolean` | `true` | Windows 98 window frame and title bar. |
| `showProgress` | `boolean` | `true` | Blocky progress bar and `xx% Complete`. |
| `showLegend` | `boolean` | `false` | Colour legend, like the original *Legend* window. |
| `loop` | `boolean` | `true` | Indeterminate mode: restart after each pass. |
| `overlay` | `boolean` | `false` | Covers the page and centres the window. |
| `palette` | `Partial<NecDefragPalette>` | `null` | Overrides single colours; missing ones stay Win98. |

| Output | Payload | Notes |
| --- | --- | --- |
| `passCompleted` | `number` | Emitted at the end of each pass, with its progressive number. |

The animation runs on a `<canvas>` **outside the Angular zone** — no change detection per
frame, only when the whole percentage changes — and it is cancelled in `ngOnDestroy`. The host
exposes `role="progressbar"` with `aria-valuenow` (determinate only) and `aria-busy`. With
`prefers-reduced-motion: reduce` the disk advances at a crawl and the read/write head stops
blinking. Angular 16+ compatible: classic `@Input`/`@Output`, `*ngIf`/`*ngFor`, no API newer
than 16.2.

The simulation is exported on its own (`necCreateDefragField`, `necDefragStep`,
`necDefragProgress`, `necDefragAdvanceTo`, `necDefragComplete`, `NecDefragCluster`) if you want
to drive a different renderer with it.

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
