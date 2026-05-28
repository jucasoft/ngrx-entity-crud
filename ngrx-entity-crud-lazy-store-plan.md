# Piano: store **lazy** + loading/error **agnostico** in `ngrx-entity-crud`

> Documento di lavoro da portare nel repo della libreria **ngrx-entity-crud**.
> Prodotto nel testbed `ng16ForMigrationTestTo19` (branch `feature/add-schematics-generetor-b`).
> Implementazione di riferimento già validata: branch **`experiment/lazy-store-loading`** di questo testbed.

## Contesto / perché

Oggi una sezione generata registra il proprio store NgRx in modo **eager** nel `RootStoreModule`. Vogliamo che lo store sia **lazy**: registrato nel *feature module* della view, così reducer/effects partono solo all'apertura della sezione (passo anche verso standalone/`provideState` di Angular 19).

Il wiring eager **non** è in `grm-schematics` (locale) ma in **`ngrx-entity-crud:store`** → va modificato lì (scelta architetturale: alla radice).

## Stato attuale — `schematics/store/index.ts` (ramo `CRUD-PLURAL`)

`makeStore` compone (vedi `crudRules`):
1. `addExport(index.ts / index.d.ts)` → `export * from './<name>-store'` *(genericRules)*
2. `addImport(state.ts, '<Clazz>StoreState')` + `updateState('<name>:<Clazz>StoreState.State;')`
3. `addImport(selectors.ts, '<Clazz>StoreSelectors')` + **`addRootSelector(...)`** → inserisce `<Clazz>StoreSelectors.selectError/selectIsLoading` nell'aggregatore `createSelectorFactory` di `selectors.ts`
4. `render(crud-model, pathVo)`
5. **`addDeclarationToNgModule({ module: root-store.module.ts, name: '<Clazz>Store' })`** → aggiunge `<Clazz>StoreModule` agli `imports` del root **(EAGER)**
6. `render(crud-store/plural)` + `render(crud-service/plural)`

Due punti rendono impossibile il lazy così com'è:
- **(5)** registra lo store eager nel root;
- **(3)** l'aggregatore di `selectors.ts` importa staticamente i selettori del dominio → con store lazy `createFeatureSelector` gira su uno stato in cui la slice non c'è ancora → errore a runtime.

## Obiettivo

Opzione **`--lazy`** (opt-in, default `false` per retrocompatibilità) che:
- NON registra lo store eager nel root;
- NON accoppia `selectors.ts` ai domini (loading/error **agnostico**);
- lascia che sia il *feature module* (generato da `grm-schematics:view`) a importare `<Clazz>StoreModule`.

## Modifiche proposte in `ngrx-entity-crud`

### 1. `schematics/store/schema.json`
Aggiungere proprietà:
```jsonc
"lazy": { "type": "boolean", "default": false,
          "description": "Registra lo store nel feature module (lazy) invece che eager nel RootStoreModule." }
```

### 2. `schematics/store/index.ts` — rendere condizionali i passi eager
Nei `crudRules`, quando `options.lazy === true`:
- **saltare** `addDeclarationToNgModule({ module: root-store.module.ts, ... })` → lo store NON entra nel root;
- **saltare** `addImport(selectors.ts, '<Clazz>StoreSelectors')` **e** `addRootSelector(...)` → l'aggregatore non viene accoppiato al dominio;
- in `updateState`, generare la slice **opzionale** (`<name>?: <Clazz>StoreState.State;`) perché a runtime non esiste finché la sezione non è caricata;
- lasciare invariati `addExport` e i `render` dei file store/service.

(Eager = comportamento attuale invariato → nessuna regressione per chi non passa `--lazy`.)

### 3. Loading/error **agnostico** in `selectors.ts` (via `ng-add`)
Il `selectors.ts` del progetto va reso indipendente dai domini: invece dell'aggregatore `createSelectorFactory(...)` che importa `XxxStoreSelectors`, usare selettori che **scandiscono lo stato root** sfruttando la convenzione `EntityCrudBaseState` (ogni slice CRUD ha `isLoading: boolean` ed `error: string` top-level):
- `selectLoadingNames` = chiavi delle slice con `isLoading === true`;
- `selectIsLoading` = `selectLoadingNames.length > 0`;
- `selectError` = concatenazione degli `error` non vuoti;
- config opzionale: blacklist/whitelist di chiavi.

Questo `selectors.ts` agnostico va messo nel template di **`schematics/ng-add/files/src/app/root-store/`** (il setup iniziale del progetto), così nasce già agnostico e i passi (3) dello store non servono più. Codice di riferimento: `loading.selectors.ts` del branch `experiment/lazy-store-loading`.

### 4. Coordinamento con `grm-schematics:view`
In modalità lazy lo store NON è registrato da nessuna parte da `ngrx-entity-crud`: **il feature module della view deve importare `<Clazz>StoreModule`**. Nel testbed il template del module di `grm-schematics` è già pronto a farlo (vedi `experiment`). Documentare: *"con `--lazy`, importare `<Clazz>StoreModule` nel modulo lazy della feature"*.

### 5. (Opzionale) `ng-add` / README
- Aggiornare il README della libreria con l'opzione `--lazy` e la nota sul feature module.
- Valutare se rendere `lazy` il default in una major successiva.

## Sequenza per implementare/validare
1. `git clone` del repo `ngrx-entity-crud`; applicare le modifiche 1–3 (+4 doc).
2. Build della libreria; `npm link` (o versione locale) verso il testbed `ng16ForMigrationTestTo19`.
3. Nel testbed: assicurarsi che `grm-schematics:view` importi `<Clazz>StoreModule` nel feature module (portare la modifica dal branch `experiment`).
4. Rigenerare una sezione con `ng generate ngrx-entity-crud:store --name foo --clazz Foo --type CRUD-PLURAL --lazy` + `ng generate grm-schematics:view --clazz Foo`.
5. Validare: `npm run build` (la slice deve finire nel chunk lazy della view) e runtime (apertura sezione, ricerca, niente errori dell'aggregatore).

## Riferimenti
- Implementazione PoC validata: branch **`experiment/lazy-store-loading`** (file `src/app/root-store/loading.selectors.ts`, store importato in `*.module.ts`).
- Logica eager attuale: `node_modules/ngrx-entity-crud/schematics/store/index.js` + `schematics/my-utility.js` (`addDeclarationToNgModule`, `addRootSelector`).
