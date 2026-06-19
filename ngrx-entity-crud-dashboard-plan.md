# ngrx-entity-crud — Dashboard di gestione progetto (piano)

> Stato: **PIANO COMPLETO — Fasi 0, 1, 2, 3 fatte** (entry-point `ngrx-entity-crud/devtools` + 3 probe + component con privacy/reveal + `lazy-report` esteso non-breaking + schematic `ngrx-entity-crud:dashboard` + README/TEST.md + 88 test, build e lint puliti). Branch `19.4.0-beta`. Non ancora committato.
> Companion di `ngrx-entity-crud-lazy-store-plan.md`.

## Obiettivo

Aggiungere alla libreria una **dashboard di gestione progetto** che mostra tre riepiloghi a runtime:

1. **localStorage** — chiavi e spazio occupato.
2. **IndexedDB** — database / object store / numero record (in modo **agnostico** rispetto alla libreria di persistenza).
3. **Store NgRx + sezioni lazy** — slice montate, loading/error, e candidati al lazy loading (riuso di `lazy-report`).

## Decisioni prese (committente)

- **Forma: ibrida a 3 strati** (runtime + schematic + lazy-report esteso).
- **IndexedDB agnostico**: oggi il consumer persiste con `ngrx-store-idb`, ma intende **sostituirla a breve** → l'introspezione **non deve accoppiarsi a nessuna libreria**. Solo API native + adapter opzionale via token + nomi DB via `@Input`.
- **Uso anche in produzione**: niente gate `environment.production`. Privacy by default (mai i valori grezzi, solo chiavi/dimensioni/conteggi; reveal opt-in), performance (refresh on-demand, polling opt-in, `OnPush`), stima byte IndexedDB solo opt-in.

## Contesto rilevato nel codebase (vincoli)

- **Nessun layer di persistenza nel repo**: `libs/ngrx-entity-crud/package.json` ha `dependencies: {}`, `metaReducers` (template `ng-add/.../root-store/root-reducer.ts`) è vuoto. I dati storage provengono interamente dal consumer (oggi `ngrx-store-idb`).
- **Nessun registro store né flag lazy/eager a runtime**: lazy è solo compile-time (`store --registration=lazy` → slice opzionale `?:` + salta `addDeclarationToNgModule`). A runtime lo stato lazy-non-caricato si deduce **solo per assenza della chiave** di slice nello stato root.
- **Selettori agnostici loading/error** esistono **solo nel template** `ng-add/.../root-store/selectors.ts`, non sono esportati dal pacchetto npm. Si basano sulla convenzione `EntityCrudBaseState<T>` (ogni slice CRUD espone `isLoading: boolean` / `error: string` al top level — vedi `src/lib/models.ts`).
- **`lazy-report`** (`schematics/lazy-report/index.ts`) è già un analizzatore statico read-only; con `--format=json` produce `{ paths, stores[] }` (campi per store: `name, clazz, type, infra, sections, usedByShell, verdict`). Analisi text-based (regex `STORE_REF`, no AST); route lazy rilevata via stringa letterale `views/<s>/<s>.module`.
- `EntityCrudState<T>` estende `EntityState<T>` → ha `ids`/`entities` (conteggio entità). `EntitySingleCrudState<T>` ha `item` (nessun `ids`).
- Build: `@nx/angular:package` (ng-packagr) con `tsconfig.lib.json` (`include: ["**/*.ts"]`, esclude spec) → i secondary entry-point sotto `src/` sono inclusi automaticamente. `assets` copia `./schematics/**` (quindi un nuovo schematic `dashboard/` viene incluso senza modifiche al packaging). Test con Jest (`jest-preset-angular`).

## Architettura: ibrida a 3 strati

### Strato 1 — Runtime (cuore): secondary entry-point `ngrx-entity-crud/devtools`

Nuova cartella `libs/ngrx-entity-crud/src/devtools/` con proprio `ng-package.json` + `public-api.ts`. Il `public-api.ts` **principale non cambia**. Contenuto:

- `NecDashboardComponent` (`<nec-dashboard>`) — standalone, `OnPush`, template HTML inline (no PrimeNG → importabile ovunque). 3 pannelli. `@Input`: `blacklist`/`whitelist` (`string[]`), `lazyReportUrl` (default `assets/lazy-report.json`), `idbDatabaseNames` (fallback Firefox/Safari), `pollingMs` (default 0 = manuale), `revealValues` (default false). Mostra solo chiavi+dimensioni.
- `NecLocalStorageProbeService` — `Object.keys(localStorage)` sincrono; byte quota = **UTF-16** `(key.length+value.length)*2` (primaria), UTF-8 (`TextEncoder`/`Blob`) secondaria; `navigator.storage.estimate()` per la quota aggregata.
- `NecIndexedDbProbeService` — **agnostico**: priorità reale (1) `NEC_IDB_ADAPTER` esplicito, (2) nativo `indexedDB.databases()` + `open()` + `count()`. Timeout su `open()`, `onblocked`, `abort` di `onupgradeneeded` (non crea DB), `close()` immediato. Nessun import di librerie di persistenza.
- `NecStoreProbeService` — `store.select(s=>s)` (take 1, sincrono) + scan per convenzione (`typeof value.isLoading === 'boolean'`); per slice: `kind`, `entityCount` (solo plural), `isLoading/isLoaded/error`, `responsesCount`. Correlazione opzionale con `lazy-report.json` via `fetch()` nativo (no `HttpClient`).
- `NEC_IDB_ADAPTER` (`InjectionToken<NecIdbAdapter>`) + interfaccia `NecIdbAdapter { name; isAvailable(); listDatabases() }`.
- `createAgnosticLoadingSelectors({ rootSelector?, blacklist?, whitelist? })` — **port-as-factory** dei selettori del template (refactor di firma: blacklist/whitelist/rootSelector come parametri). Il template `ng-add` resta invariato (retro-compat).

La libreria resta `dependencies: {}`. Nuove dipendenze HARD del sotto-modulo: solo `@angular/core`, `@angular/common`, `@ngrx/store`, `rxjs` (già peerDep). `fetch()` nativo evita dipendenza da `HttpClient`.

### Strato 2 — Schematic opzionale `ngrx-entity-crud:dashboard`

Clona lo scheletro di `schematics/section/index.ts` (lettura `angular.json` + `ngrx-entity-crud.conf.json`, `render()`, `addRouteDeclarationToNgModule` con `loadChildren` lazy). I template `files/primeng/dashboard/` generano un **thin wrapper** PrimeNG (`DashboardModule` + routing + `DashboardMainComponent`) che monta `<nec-dashboard>` importato da `ngrx-entity-crud/devtools`. La logica resta nella lib (un solo posto, testabile). Opzione `includeLazyReport` (default true) → compone `lazyReport({ output:'src/assets/lazy-report.json', format:'json' })`.

**Fix richiesto**: non clonare ciecamente `workspace.defaultProject` (rimosso da Angular 15+) → fallback `workspace.defaultProject ?? Object.keys(workspace.projects)[0]` con `SchematicsException` se nessun progetto.

### Strato 3 — `lazy-report` esteso (non-breaking)

`schematics/lazy-report/index.ts`: aggiungere
- `detectStorageProvider(tree)` (regex `STORAGE_REF` su `package.json` + `.ts`) → campo `storage` nel JSON e sezione `## Storage` nel markdown;
- campi **strutturati** per store: `lazyRoute: boolean`, `isLazyCandidate: boolean` (derivati da `verdict()`/`lazySections`), e `generatedAt: string` (ISO) a livello top per il rilevamento staleness.

Così la dashboard correla per campi booleani invece di **parsare la stringa `verdict`**. Resta non-breaking: `{ paths, stores }` invariato, solo aggiunte. Una sola opzione opzionale `storage?: boolean` (default true).

## Le 3 sezioni (cosa mostra / come / limiti)

### 1) localStorage
- **Mostra**: tabella chiavi → byte (UTF-16 primaria / UTF-8 secondaria), totale, conteggio, top-N, quota aggregata.
- **API**: `localStorage` (`length`/`key`/`getItem`), `TextEncoder`/`Blob`, `navigator.storage.estimate()`.
- **Limiti**: sincrono/bloccante (misura on-demand); `estimate()` è **aggregata origine** (localStorage+IndexedDB+Cache), arrotondata/assente su Safari, richiede secure context; guard `typeof window` + try/catch (SSR/incognito).

### 2) IndexedDB
- **Mostra**: adapter rilevato, DB → object store → `count()` (record), versione DB, e **un solo** "totale origine" da `estimate()` etichettato non scorporabile.
- **API**: `indexedDB.databases()`/`open()`/`count()`, `navigator.storage.estimate()`; opzionale `NEC_IDB_ADAPTER`.
- **Limiti** (strutturali): byte per-record/per-store **non misurabili** (solo opt-in via serializzazione, costoso/approssimato); `indexedDB.databases()` **assente su Firefox** e Safari vecchi → fallback `idbDatabaseNames` o "enumerazione non disponibile"; auto-detection via `globalThis.*` è best-effort (in app bundlata serve il token); `open()` può bloccarsi → timeout + `onblocked` + `close()`.

### 3) Store NgRx + lazy
- **Mostra**: tabella store → `{ type, entità (solo plural), isLoading, isLoaded, error, responses, verdetto statico, stato runtime: montato / lazy-non-caricato / in-loading / in-errore }` + contatori.
- **API**: `Store.select(s=>s)` (in-memory), `fetch(lazy-report.json)`.
- **Limiti**: nessun flag lazy/eager runtime → lazy-non-caricato = chiave assente in stato root + report; mappatura `name`→chiave di slice best-effort (Fase 1: far emettere a `lazy-report` la feature key reale); store singular senza conteggio entità; JSON è snapshot build-time (campo `generatedAt` per staleness).

## Modifiche a API / schematics

- `src/public-api.ts` (main): **invariato**.
- `src/devtools/ng-package.json` + `src/devtools/public-api.ts`: **NUOVI** (secondary entry-point auto-rilevato da ng-packagr).
- `package.json` (lib): `dependencies` resta `{}` (localForage/Dexie/idb/ngrx-store-idb mai importati).
- `schematics/lazy-report/{index.ts,schema.json,schema.d.ts}`: estensione non-breaking (+`storage?`, +campi strutturati).
- `schematics/collection.json`: +voce `dashboard`.
- `schematics/dashboard/`: NUOVO (index.ts + schema + files/primeng/...).
- Template `ng-add/.../root-store/selectors.ts`: **invariato** (la logica viene portata, non spostata).

## Fasi

- **Fase 0 — MVP runtime** (in corso): PoC build secondary entry-point → 3 probe (nativi/agnostici) → `<nec-dashboard>` con privacy/perf → test Jest (mock localStorage/store; IndexedDB con `fake-indexeddb` da valutare).
- **Fase 1 — `lazy-report` esteso** (non-breaking) + correlazione runtime nel pannello 3. ✅ FATTA: campi `lazyRoute`/`isLazyCandidate`/`generatedAt` + `storage` (provider rilevati da package.json), opzione `storage?:boolean` (default true), correlazione nel `NecStoreProbeService` (booleano, non parsing del verdetto) + `lazyReportGeneratedAt` per la staleness. Test d'integrazione `src/test/lazy-report.spec.ts` (HostTree).
- **Fase 2 — schematic `dashboard`** (clone di `section` con fix `defaultProject`, route lazy, wrapper PrimeNG). ✅ FATTA: `schematics/dashboard/` (index + schema + 4 template `files/primeng/__clazz@dasherize__/`), registrato in `collection.json`, opzioni `clazz`/`project`/`includeLazyReport`/`lazyReportOutput`. Fix `resolveProjectName` (defaultProject → primo progetto) + `dashboardRouteLiteral` estratti e testati (`src/test/dashboard.spec.ts`). Verifica end-to-end (SchematicTestRunner su dist): 4 file generati, rotta lazy inserita, `lazy-report.json` con `storage.providers:["ngrx-store-idb"]`.
- **Fase 3 — robustezza/privacy**: adapter IndexedDB, Firefox/Safari, mascheramento valori, README `## dashboard`. ✅ FATTA: `devtools/mask.ts` (`looksSensitiveKey`/`redactSensitive`/`maskValue`) + `readValue()` on-demand sul probe localStorage + input `allowRevealValues` (reveal opt-in mascherato, marker ⚠ per chiavi sensibili) nel component; README `## dashboard` + opzione `--storage` di lazy-report + ricetta `TEST.md`. Firefox/Safari già gestiti dal probe (degrado + `idbDatabaseNames`).
- ~~Fase 4 — meta-reducer di persistenza~~: **non necessaria** per questo consumer (già persiste via `ngrx-store-idb`).

## Rischi principali

- Secondary entry-point ng-packagr (prima volta che la lib esporta un component): verificare emissione `dist/ngrx-entity-crud/devtools` e che main + `build:schematics` restino integri (de-risk in Fase 0 PoC).
- `estimate()` aggregata e arrotondata → etichettare sempre come "totale origine".
- `indexedDB.databases()` assente su Firefox → degrado dichiarato, non edge-case.
- `store.select(s=>s)` è accoppiamento globale → accettabile per tool diagnostico; mitigato con `OnPush` + refresh on-demand.
- Privacy in produzione → default solo chiavi/dimensioni, reveal opt-in, mascheramento pattern sensibili.
- Ampliamento superficie pubblica (entry-point secondario) → versionare con cura (single source: `libs/ngrx-entity-crud/package.json`).
