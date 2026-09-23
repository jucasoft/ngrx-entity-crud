# Changelog — Pre-release beta

Elenco dei commit aggregati per ogni tag `beta` presente nella cronologia git di questo repo,
dal più recente al più vecchio. Per ogni tag l'intervallo considerato va dal tag precedente
(qualsiasi, non solo beta) fino al tag stesso.

Non sono incluse le versioni stabili (es. `v19.2.6`, `v19.1.0`, ecc.) né i commit che si limitano
a un bump di versione senza altro contenuto — per quelli vedi `git log` / `git tag`. Ogni voce
riporta lo short hash del commit tra parentesi.

## Migrazione da v19.2.6 (ultima stabile) a 19.4.0

Cambi da conoscere prima di aggiornare un progetto consumer. Dettagli e test consigliati in
`docs/code-review/2026-09-23-audit-best-practice-retrocompat.md` (sezioni 3 e 4).

- **Selezione dopo un delete (cambio di comportamento, bug fix)** — `DeleteSuccess`,
  `DeleteManySuccess` e `Delete` ora tolgono davvero gli id cancellati da `idsSelected` /
  `entitiesSelected` e **mantengono** le altre selezioni. Prima, dopo `DeleteSuccess` la
  selezione multipla conteneva solo l'id cancellato, e dopo `DeleteManySuccess` restavano
  selezionati anche gli elementi cancellati (`id in ids` controllava gli indici dell'array, non i
  valori). Gli id `0` e `''` ora sono trattati come id validi (prima `idSelected = 0` azzerava
  `itemSelected`). Se la tua UI contava sull'azzeramento della selezione dopo un delete, dispatcha
  esplicitamente `RemoveAllSelected()`.
- **Loading/error globale e nuovi store (codice generato)** — lo schematic `store` non modifica più
  `root-store/selectors.ts`. I progetti creati con un `ng add` precedente hanno un `selectors.ts`
  che elenca gli store a mano: gli store generati da ora in poi **non** accendono il loading/errore
  globale. Due opzioni: sostituire `root-store/selectors.ts` con il nuovo template agnostico
  (`schematics/ng-add/files/src/app/root-store/selectors.ts`, che scandisce ogni slice con
  `isLoading` e normalizza anche gli errori oggetto, es. `HttpErrorResponse`), oppure aggiungere a
  mano `XxxStoreSelectors.selectIsLoading` / `selectError` al file esistente.
- **Schematic `auth0` rimosso** — `ng g ngrx-entity-crud:auth0` non esiste più. Il codice già
  generato non è toccato.
- **Schematic `store`: due nuove domande** — `registration` (`eager` | `lazy`) e `persist`
  (boolean). In modalità interattiva vengono chieste; gli script di scaffolding devono passarle
  esplicitamente (`--registration=eager --persist=false` riproduce il comportamento storico) o
  usare `--interactive=false`.
- **Nuovi secondary entry point e versioni minime** — `ngrx-entity-crud/persistence`,
  `/devtools`, `/ui`, `/form-clipboard` richiedono **Angular ≥ 16** (usano `signal`, `computed`,
  `inject` e componenti standalone), anche se le peerDependencies del pacchetto restano `^11`
  per il core. `persistence`, `devtools` e `form-clipboard` richiedono inoltre `primeng` (≥ 16) e
  `primeicons`, dichiarate come peerDependencies **opzionali**: chi importa solo il core
  (`ngrx-entity-crud`) non ne ha bisogno.

## Non ancora rilasciato

- fix(persistence): le bozze in debounce non vengono più riscritte dopo `RemoveManySelected`,
  `RemoveAllSelected`, `DeleteSuccess`, `DeleteManySuccess` o una nuova `SearchRequest` (bozze
  che ricomparivano al restore, bozze orfane senza blocco search).
- fix(persistence): se la scrittura del blocco search fallisce, la bozza successiva la ritenta.
- fix(persistence): `open()` non tiene in cache un'apertura fallita, ha un timeout
  (`openTimeoutMs`, default 10000) e cede la connessione su `versionchange` (una scheda aperta con
  una versione vecchia del DB non blocca più la persistenza di quella nuova).
- fix(core): `RestoreSuccess` azzera `idSelected`/`itemSelected` se l'elemento non è tra quelli
  ripristinati.
- fix(core): `BaseSingularCrudService.select()` scrive in console solo con `debugMode()`.
- fix(persistence): `<nec-restore-search>` avvisa in dev mode se `[feature]` è vuoto; README
  corretto (`feature` identifica la sezione, non è un'etichetta).
- fix(schematics): `ng-add` — `selectErrors` normalizza gli errori oggetto invece di scartarli.
- fix(schematics): `section` — il pulsante delete scarta gli elementi selezionati non presenti in
  `entities`.

## v19.4.0-beta.18 — 2026-07-20

- feat(devtools): Copyable promote command in the Lazy sections panel (ad4a9e9)

## v19.4.0-beta.17 — 2026-07-13

- feat(devtools): Live grids panel with opt-in runtime grid registry (79c6469)

## v19.4.0-beta.16 — 2026-07-13

- feat(devtools): Scaffold panel builds the new-section conf file and commands (b41b664)
- feat(devtools): Tables panel correlates static grid inventory with mounted slices (da80fcc)
- feat(schematics): table-report scans grids (ag-Grid/p-table) with AST column extraction (4b490d6)

## v19.4.0-beta.15 — 2026-07-06

- feat(devtools): English-only UI and dedicated Python snippet panel with masked previews (7b7d62a)

## v19.4.0-beta.14 — 2026-07-06

- fix(schematics): lazy-report default output follows --format (json no longer written to .md) (1839765)

## v19.4.0-beta.13 — 2026-07-06

- fix(devtools): drop p-message, PrimeNG 16 exports UIMessage instead of Message (59b6562)

## v19.4.0-beta.12 — 2026-07-06

- feat(devtools): polish dashboard UX and add Python snippet export (a30c676)
- docs: document the release/publish procedure and fix npm-publish trigger description (2f32f9b)

## v19.4.0-beta.11 — 2026-07-06

- feat(form-clipboard): add form criteria copy/paste secondary entry point (c90f332)

## v19.4.0-beta.10 — 2026-06-26

- feat(devtools): rebuild NecDashboardComponent on PrimeNG components (7b1c8b0)

## v19.4.0-beta.9 — 2026-06-26

- feat(devtools): add slice "has data" filter and expandable IndexedDB tree to NecDashboardComponent (2523dd4)

## v19.4.0-beta.8 — 2026-06-25

- feat(devtools): add per-row reset / reset-responses / reset-all to NecDashboardComponent (15812fa)

## v19.4.0-beta.7 — 2026-06-22

- fix(devtools): make NecDashboardComponent backward-compatible with Angular 14+ (d990639)

## v19.4.0-beta.6 — 2026-06-22

- fix(reducer): annotate createCrudReducer return as ActionReducer<S> (9a212e5)

## v19.4.0-beta.5 — 2026-06-19

- docs: document the dashboard, lazy-report storage option and design plan (d2a604b)
- feat(schematics): add ngrx-entity-crud:dashboard generator (cb2f94f)
- feat(devtools): add ngrx-entity-crud/devtools project dashboard (79baca8)
- feat(schematics): extend lazy-report with structured fields and storage detection (66cc1cf)

## v19.4.0-beta.4 — 2026-06-18

- chore: pin root package.json to 0.0.0 and mark it private (46010a6)
- ci(workflows): remove dead main.yml (b69a658)

## v19.4.0-beta.3 — 2026-06-17

_Prima beta della serie 19.4.0 (nessun tag `.1`/`.2`; la serie parte da `.3`). Intervallo esteso perché segue l'ultima stabile `v19.2.6` (2025-10-13)._

- ci(workflows): bump GitHub Actions to Node 24 runtimes, build on Node 22 (0b497a2)
- feat(schematics): add ngrx-entity-crud:lazy-report analysis command (fc365e2)
- refactor(schematics): remove dead addRootSelector/addLine helpers (dda7abf)
- feat(schematics): lazy store registration + agnostic loading/error selectors (2eb4c7d)
- docs: add CLAUDE.md with build commands and architecture overview (ec855b0)

## v19.2.1-beta.8 — 2025-09-30

_Solo bump di versione, nessuna modifica funzionale._

## v19.2.1-beta.7 — 2025-09-30

_Solo bump di versione, nessuna modifica funzionale._

## v19.2.1-beta.6 — 2025-09-30

- feat: update version to 19.2.1-beta.6 and remove unused files (e4d4419)
- refactor: remove unused karma files (b6e67a9)

## v19.2.1-beta.5 — 2025-09-29

- Abilitata la modalità Ivy e impostato `compilationMode` su `partial` nella configurazione di Angular Compiler (ef4d7d5)
- Aggiornata versione del progetto a `19.2.1-beta.5` e ripristinato caricamento degli artifact nel workflow GitHub Actions (9c2351f)

## v19.2.1-beta.4 — 2025-09-29

- Aggiornata la versione del progetto a `19.2.1-beta.4` e corretto percorso per ottenere la versione del pacchetto nel workflow di pubblicazione su npm (79cd5f2)

## v19.2.1-beta.3 — 2025-09-29

_Solo bump di versione, nessuna modifica funzionale._

## v19.2.1-beta.2 — 2025-09-29

- Riorganizzato workflow GitHub Actions: separata pubblicazione su npm in un file indipendente e semplificata configurazione dei tag di versione (efec3e8)

## v19.2.1-beta.1 — 2025-09-29

- Aggiornata configurazione Jest: aggiunto `testMatch` per individuare file `.spec.ts`, modificata configurazione di test zone in `test-setup.ts`, e aggiornato mock dello store nei test (2baafc2)
- Aggiornato workflow CI: aggiunto `xvfb-run` al comando di test per `ngrx-entity-crud` e aggiornati flag di ChromeHeadlessCI in `karma.conf.js` per migliorare la stabilità (5cc72e0, 97b1739)
- Semplificato il workflow CI: rimosso `xvfb-run` dal comando di test per `ngrx-entity-crud` (ad2e5f2)
- Aggiornata configurazione di Karma: aggiunti flag `--disable-gpu` e `--disable-dev-shm-usage` per migliorare la stabilità in modalità headless (b77be5f)
- Aggiornata configurazione di Karma: sostituiti `Chrome` con `ChromeHeadlessCI`, disabilitato `autoWatch`, e aggiunta configurazione per l'esecuzione in modalità headless (46a22c9)
- Aggiornata la versione del progetto a `19.2.0-beta.3` e aggiunto file di documentazione per i workflow GitHub Actions (1c71f0e)
- Aggiornato comando di test CI: aggiunta configurazione `--configuration=ci` in `reusable-build.yml` (b2a9fe5)
- Uniformato comando di test nel workflow CI: sostituito `nx` con `npx nx` in `reusable-build.yml` (53c1f69)
- Rimossa configurazione CI non necessaria dal comando di test in `reusable-build.yml` (c882981)
- Semplificato workflow CI: disabilitati passaggi superflui nel workflow riutilizzabile e integrato nell'esecuzione su push (0b85491)
- Rimossa configurazione obsoleta per `browsers` nella configurazione CI di `ngrx-entity-crud` (f4a66da)
- Aggiornato workflow CI: sostituito comando di test con `nx test ngrx-entity-crud --configuration=ci` e aggiunta configurazione CI specifica nel progetto `ngrx-entity-crud` (46edd1d)

## v19.2.0-beta.2 — 2025-09-24

- Aggiunto workflow principale per CI: configurata build, test e pubblicazione automatica su npm con verifica delle versioni tag e package.json (9e9ee1f)
- Ottimizzato workflow di pubblicazione su npm: gestita differenziazione tra release beta e stabili, migliorata chiarezza dei commenti e aggiornato node-version (ddbb14a)
- Rimosse importazioni inutilizzate nei test di `ngrx-entity-crud` e ottimizzata configurazione ESLint eliminando pacchetti obsoleti (050a3cd)
- Migliorata gestione delle proprietà con `Object.prototype.hasOwnProperty.call` in `base-singular-crud.service.ts` per garantire maggiore sicurezza e coerenza (3f24c26)
- Rimosse istruzioni `debugger`, migliorata gestione di proprietà con `Object.prototype.hasOwnProperty.call` e ottimizzata formattazione del codice (104038b)
- Aggiornata configurazione ESLint: aggiunta regola `@typescript-eslint/no-explicit-any` con livello `warn` (1e60506)
- Uniformato stile del codice: aggiunti punti e virgola mancanti, normalizzate stringhe e formattazione per mantenere coerenza nel progetto (a343e06)
- Aggiornata configurazione ESLint: migliorata gestione di regole per variabili inutilizzate, esclusi file specifici e uniformato stile delle regole (3e91b2d)
- Snellita configurazione ESLint: rimosse regole obsolete e non essenziali per Angular (b2b45cf)
- Aggiunti Husky e lint-staged per migliorare la gestione dei pre-commit e allineata configurazione di Prettier e pacchetti di sviluppo (cb35c18, 8237d9f)
- Migrato da TSLint a ESLint: rimossa configurazione TSLint e aggiunti pacchetti e regole necessari per ESLint (982c8d7)
- Aggiornato workflow `npm-publish.yml`: aggiunti permessi per `actions/download-artifact`, configurazione di directory dedicata per gli artifact e utilizzo di Node.js 20 LTS (6824cc5)
- Aggiunto upload e download di artifact al workflow riutilizzabile e semplificato processo di pubblicazione su npm (fb4c5ff)
- Introdotti workflow riutilizzabili per build e test, aggiunto nuovo workflow per validazione delle pull request e semplificato processo di pubblicazione su npm (0197d78)
- Rimosso step `Test` dal workflow `build-on-push.yml` per semplificazione del processo di build (88e2a08)
- Aggiunto workflow GitHub Actions `build-on-push.yml` per eseguire build e test su ogni push (b1f148e)
- Rimosso `package-lock.json` obsoleto per pulizia del repository e gestione coerente delle dipendenze (d76ac57)

## v19.2.0-beta-1 — 2025-09-17

_Primo tag beta della cronologia di questo repo._

- Aggiornata configurazione workflow GitHub Actions: utilizzo di Node.js 20 (LTS), caching delle dipendenze npm per migliorare le performance, upload degli artifacts di build e semplificazione del processo di pubblicazione su npm (ba03f7e)
- Allineata configurazione di `project.json`, `ng-package.json` e `tsconfig.schematics.json` per migliorare gestione di schematics e build automation (214c0dd)
- Aggiornato script `build` in `package.json` per eseguire `nx build ngrx-entity-crud` con l'opzione `--skip-nx-cache` (c0d3784)
- Aggiornato `outDir` in `tsconfig.schematics.json` per utilizzare la directory `dist` anziché `libs` (75a8b77)
- Aggiornata configurazione per `ngrx-entity-crud` in `project.json` e `package.json` con nuovi target `build-schematics`, `link`, `publish` e relativi script per semplificare build e pubblicazione (902dc1f)
- Aggiunti script `build:schematics:watch` e `npm:build:watch` a `package.json` per supportare la compilazione in modalità watch (2981473)

---

## Come rigenerare / estendere questo changelog

Elenco dei tag beta e del loro intervallo di commit (tag precedente, incluso quelli non-beta, → tag):

```bash
git for-each-ref --sort=creatordate --format '%(creatordate:short) %(refname:short)' refs/tags
git log <tag-precedente>..<tag-beta> --no-merges --format='- %s (%h)'
```

Quando si taggano nuove beta (vedi procedura di release in `CLAUDE.md`), aggiungere qui una nuova
sezione in cima con lo stesso comando, usando come `<tag-precedente>` l'ultimo tag esistente in
`git tag`.
