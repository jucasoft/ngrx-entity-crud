# Audit best practice + retrocompatibilità — branch `19.4.0-beta`

- **Data**: 2026-09-23
- **Baseline di confronto**: `master` = ultima stabile `v19.2.6` (merge-base `ec855b0`), 77 commit sul branch.
- **Perimetro**: `libs/ngrx-entity-crud` (core `src/lib`, entry point `persistence`, `devtools`, `ui`, `form-clipboard`, schematics e template `files/`).
- **Stato test**: `nx test ngrx-entity-crud` → 27 suite, 347 test, tutti verdi.
- **Vincolo applicato**: nessuna correzione proposta deve introdurre regressioni nei progetti consumer. Ogni punto ha una colonna **Sicurezza della correzione**:
  - **Sicura**: non cambia il comportamento del codice già in uso (codice nuovo solo beta, solo log, solo documentazione, oppure solo template di codice generato da ora in poi).
  - **Con rischio**: cambia un comportamento osservabile di un'API già pubblicata come stabile. In questi casi il consiglio è **non toccare**, oppure farlo solo con nota di migrazione in una major.

## 0. Verifica "effect iniettato in un componente"

Confermato: **non è più presente**. Nessun componente inietta classi Effects (`grep` su `Effects`/`Injector`/`inject(` in `devtools`, `ui`, `form-clipboard` e `persistence`). Hai ragione che sarebbe stato un anti-pattern: gli effect si registrano con `EffectsModule.forFeature`/`provideEffects`, i componenti fanno solo dispatch e leggono tramite selector.

Resta però un pattern della stessa famiglia, meno grave. `NecRestoreSearchComponent` si iscrive direttamente allo stream `Actions` di `@ngrx/effects` (`persistence/nec-restore-search.component.ts:191-209`) per ricavare `restoring$` e `restoreError$`. Lo stato "restore in corso / errore" dovrebbe stare nello store (vedi **P3**).

---

## 1. Problemi di best practice (ordinati per gravità)

### Alta

| # | File:riga | Problema | Perché è un problema | Correzione proposta | Sicurezza |
|---|---|---|---|---|---|
| P1 | `persistence/nec-persistence-effects.ts:178-213` | **Race tra le bozze in debounce e le rimozioni.** `pendingDrafts` non viene ripulito da `SearchRequest`, `RemoveManySelected`, `RemoveAllSelected`, `DeleteSuccess` e `DeleteManySuccess`. | Esempio: l'utente modifica una riga e, entro 200 ms, la annulla (`RemoveManySelected`). `deleteDrafts` parte subito, poi scade il debounce e `putDrafts` riscrive la bozza, che ricompare al restore. Con `SearchRequest` nella finestra, invece, `purgeSection` cancella tutto, `lastSearch` è `null` e la bozza viene scritta **senza blocco search**. `refreshDraftCount` crea allora un `meta` con `draftCount > 0`: il prompt "Restore" compare, ma `readSection` restituisce `null`, parte `RestoreFailure('Nessun dato locale…')` e il messaggio finisce nel banner di errore globale. | Nei cinque effect citati, prima della scrittura, togliere gli id interessati da `pendingDrafts` (o svuotarlo del tutto per `SearchRequest`/`RemoveAllSelected`). Aggiungere uno spec per ciascun caso con `fakeAsync`. | **Sicura**: codice solo beta, non presente in `v19.2.6`. |
| P2 | `persistence/nec-persistence.service.ts:271-304` | `open()` tiene in cache una promise rifiutata (conferma del punto 2 dell'altra review), non ha timeout (punto 3) e **non gestisce `db.onversionchange`**. | Una scheda aperta con il DB in versione 1 blocca l'upgrade a `dbVersion: 2` nella nuova scheda: `onblocked` rifiuta e, per via della cache, la persistenza resta spenta fino al reload. Inoltre `onblocked` non è definitivo: l'`open` può riuscire dopo, lasciando una connessione orfana. | (a) `this.dbPromise = null` quando la promise viene rifiutata; (b) in `onsuccess` impostare `db.onversionchange = () => { db.close(); this.dbPromise = null; }`; (c) timeout opzionale che azzera solo la cache, senza chiudere nulla. | **Sicura**: codice solo beta. Per (c) conviene un timeout generoso (es. 10 s), altrimenti si rischiano falsi negativi su dispositivi lenti. |
| P3 | `persistence/nec-restore-search.component.ts:189-239` | Il componente ricava lo stato "restore in corso" e "errore" dallo **stream Actions**, e lo fa solo da `ngOnInit`. | Oltre all'anti-pattern, c'è un bug di timing (**plausibile**, da verificare): con uno store **eager** e `autoRestore` attivo, `SectionCheckSuccess`, `RestoreRequest` e `RestoreSuccess` possono avvenire all'avvio dell'app, prima che la route monti il componente. Il componente parte con `restoring=false` e `dismissed=false` e trova `check.stats` valorizzato, quindi mostra il prompt "Restore" su dati già ripristinati. Premendolo si sovrascrivono le modifiche fatte nel frattempo (`setAll`). | Aggiungere a `createPersistenceReducer(feature, actions?)` un secondo parametro **opzionale** che, se passato, gestisce `RestoreRequest/Success/Failure` nella slice `:persistence` (`restoring`, `restored`, `restoreError`). Il componente legge questi campi tramite selector e usa lo stream Actions solo come fallback se `actions` non è stato passato al reducer. | **Sicura** se il parametro è opzionale e il fallback resta. |

### Media

| # | File:riga | Problema | Perché è un problema | Correzione proposta | Sicurezza |
|---|---|---|---|---|---|
| P4 | `persistence/nec-persistence-effects.ts:178-182` | `SelectItems` **sostituisce** la selezione nello store, ma l'effect fa solo `putDrafts` (upsert). | Una riga deselezionata con la checkbox resta in IndexedDB come bozza e al restore torna selezionata. Inoltre una semplice selezione conta come "unsent change" (la lista generata usa `SelectItems` per la checkbox) e, in modalità `on-draft`, fa scrivere il blocco search. | Da decidere: (a) per `SelectItems` sincronizzare le bozze (cancellare quelle non più nel set); (b) persistere come bozza solo le righe "dirty" (`dirtyDraftIds` esiste già nel template). | **Sicura** a livello di libreria (solo beta), ma è una **scelta di design**: va decisa prima della stable. |
| P5 | `persistence/nec-persistence-effects.ts:63-73` | L'effect tiene **stato mutabile** (`pendingDrafts`, `lastSearch`, `searchPersisted`, `saveMode`). | È stato non ispezionabile dai devtools, duplicato rispetto a `check.saveMode` nello store, e causa di P1 e del punto 1 dell'altra review. | **Non ora.** Dopo P1 e il punto 1 dell'altra review, valutare di spostare `saveMode` e `lastSearch` nella slice `:persistence`. | Refactor ampio: rimandare. |
| P6 | `src/lib/effect-delete.ts:52`, `src/lib/effect-create-many.ts:49` | **Preesistente.** Nel `catchError`, delete dispatcha `EditFailure` e createMany dispatcha `EditManyFailure`. | Chi ascolta `DeleteFailure`/`CreateManyFailure` non riceve le eccezioni: le riceve solo nel caso `hasError`. | **Non correggere in 19.x.** Chi oggi intercetta `EditFailure` per gli errori di delete smetterebbe di riceverli, e dispatchare entrambe raddoppierebbe i toast di chi usa `ofFailure()`. Documentarlo e rimandarlo a una major. | **Con rischio.** |
| P7 | `src/lib/base-crud-gql.service.ts:52,64,76` | **Preesistente.** `mutate`/`mutateMany`/`query` leggono `response.data.allCoins`: è codice di demo rimasto nel servizio generico. | Il servizio base funziona solo con un campo `allCoins`: per qualunque altro schema `data` è `undefined`. | Non cambiare il default. In modo additivo, aggiungere un hook `protected dataKey = 'allCoins'` (o un metodo `extractData(response)` sovrascrivibile) e documentare che va personalizzato. | **Sicura** solo se il default resta `allCoins`. |
| P8 | `schematics/ng-add/files/src/app/root-store/selectors.ts:67-72` | Il nuovo `selectErrors` scarta gli errori non stringa (`typeof error === 'string'`). | Gli effect del core, nel `catchError`, dispatchano `XxxFailure({error})` con l'**oggetto** errore (es. `HttpErrorResponse`), non con una stringa. Nei progetti generati con il nuovo `ng-add`, le eccezioni HTTP non compaiono più nel banner globale (il vecchio template le concatenava, seppure come `[object Object]`). | Nel template: normalizzare con `typeof e === 'string' ? e : e?.message ?? String(e)`. | **Sicura**: tocca solo il codice generato da ora in poi. |
| P9 | `schematics/section/.../button-delete-*.component.ts:29` | `selectItemsSelectedOrigin` mappa `ids → entities[id]` e può restituire `undefined` se un id selezionato non è in `entities` (es. ricerca con `updateMany-selected`, oppure `AddManySelected` di item esterni). | `DeleteManyRequest` con `undefined` in `mutationParams` porta a un `TypeError` in `getId()`, finisce nel `catchError` e produce `EditFailure`, con un messaggio poco chiaro. | Nel template: `map(items => items.filter(Boolean))`. **Non** modificare il selector nel core, perché cambierebbe la lunghezza dell'array per chi lo usa già. | **Sicura**: solo template. |

### Bassa

| # | File:riga | Problema | Correzione | Sicurezza |
|---|---|---|---|---|
| P10 | `src/lib/base-singular-crud.service.ts:16,36-38` | **Preesistente.** 4 `console.log` incondizionati (uno fa il dump di `httpOptions`, potenzialmente con header). | Racchiuderli in `if (this.debug)`, come già avviene in `BaseCrudService`. | **Sicura**: cambiano solo i log. |
| P11 | `src/lib/reducer.ts:22-24` | **Preesistente.** `searchRequestOn` lancia un'eccezione **dentro il reducer** se il payload è vuoto. I reducer dovrebbero essere puri e non lanciare. | **Non toccare.** Oggi l'errore arriva in modo sincrono al `dispatch` del chiamante, che se ne accorge subito in sviluppo; restituire lo stato cambierebbe la semantica. | **Con rischio.** |
| P12 | tutti gli `effect-*.ts` | **Preesistente.** `catchError` a livello esterno + `repeat()`, invece che dentro l'observable interno. In caso di eccezione si perde la coda di `concatMap` in volo e `Response` ha `request: null`. | **Non toccare in 19.x**: cambierebbe l'ordine e il numero di azioni emesse sugli errori. Da valutare in una major. | **Con rischio.** |
| P13 | `devtools/nec-dashboard.component.ts:807` | `setInterval` dentro la zona Angular: ogni tick scatena la change detection dell'intera app. | Avviare il timer in `zone.runOutsideAngular` e rientrare con `zone.run` solo per `refresh()`. | **Sicura**: devtools, solo beta. |
| P14 | `persistence/nec-restore-search.component.ts:168,267` | Input `[feature]` documentato come "solo display" ma usato per il `type` dell'azione (punto 4 dell'altra review). Con `feature = ''` di default nasce l'azione `[ Persistence] …`, che nessuno ascolta. | Correggere il README e aggiungere un `console.warn` in dev mode se `feature` è vuoto. **Non** ricavarlo dai selectors: cambierebbe l'API dell'input. | **Sicura.** |

---

## 2. Revisione dei 10 punti dell'altra analisi (`2026-09-19-code-review-19.4.0-beta.md`)

| # | Esito della verifica | Correzione suggerita dall'altro modello: è sicura? |
|---|---|---|
| 1 `searchPersisted` impostato in anticipo | **Confermato** | Sì: impostarlo dopo che `writeSearch` si è risolta (o ripristinarlo nel `catch`). Solo beta. |
| 2 `open()` con promise rifiutata in cache | **Confermato**, aggravato dal mancato `onversionchange` (P2) | Sì. |
| 3 `open()` senza timeout | **Confermato** | Sì, con timeout generoso e senza chiudere la connessione se poi l'apertura riesce. |
| 4 `[feature]` "solo display" | **Confermato** | Sì se si aggiorna **solo il README**. Ricavare la feature dai `selectors` cambia l'API: sconsigliato. |
| 5 `RestoreFailure` benigno nel campo `error` | **Confermato** | ⚠️ **L'opzione "non dispatchare `RestoreFailure`" introduce una regressione**: `restoreRequestOn` porta `isLoading=true`, e senza un'azione di chiusura lo spinner resta attivo per sempre, sia nello store sia in `manualInFlight$` del componente. Correzione sicura: risolvere la causa (P1, bozza orfana), così il caso "nessun dato" dopo un prompt praticamente sparisce. Un'azione nuova (`RestoreEmpty`) aggiungerebbe un membro obbligatorio a `Actions<T>` (vedi R1). |
| 6 Cambio di comportamento della selezione dopo un delete | **Confermato** (il vecchio `filter(idA => idA === id)` era un bug) | Sì: **solo** nota nel CHANGELOG. Non ripristinare il vecchio comportamento. |
| 7 `restoreSuccessOn` non azzera `idSelected`/`itemSelected` | **Confermato** | Sì: `Restore*` esiste solo nella beta. |
| 8 `deleteOn` non azzera `itemSelected` | **Confermato** | ⚠️ **Con rischio**: `Delete` (sincrona) esiste già in `v19.2.6`, dove `itemSelected` restava valorizzato. Chi oggi, dopo un `Delete`, legge `itemSelected` (es. per un messaggio "eliminato X" o per un pannello di dettaglio) cambierebbe comportamento. Consiglio: rimandare, oppure farlo con una nota di migrazione. |
| 9 Fix del delete solo per il codice generato da ora | **Confermato** | Sì: solo documentazione. Nota: il vecchio pulsante delete è corretto finché l'app non adotta la nuova lista con bozze. |
| 10 `--persist` senza UI di ripristino | **Confermato** | Sì: aggiungere `<nec-restore-search>` al template `section` tocca solo il codice nuovo. |

I due candidati confutati dall'altra review e la nota sull'effect nel componente: **concordo**.

---

## 3. Retrocompatibilità rispetto a `v19.2.6`

| # | Modifica | File:riga | Tipo di rottura | Impatto sui consumer | Mitigazione | Test consigliato |
|---|---|---|---|---|---|---|
| R1 | `Actions<T>` ha 3 membri **obbligatori** nuovi (`RestoreRequest/Failure/Success`) e `createCrudOns` chiama `on(actions.RestoreRequest, …)` | `src/lib/models.ts:391-398`, `src/lib/reducer.ts:142-173` | **Possibile** (compilazione + runtime) | Chi costruisce a mano un oggetto `Actions<T>` (mock nei test, oggetti composti, spread parziali) ottiene un errore TS2741 e, a runtime, `TypeError` dentro `on()` (`undefined.type`). Chi usa `createCrudActions` non ha nessun impatto. | Nessuna, se i consumer usano solo le factory. In alternativa, additiva: rendere i tre membri opzionali e registrare gli `on` di restore solo se presenti. | Nei consumer: `grep -rn "Actions<" src` e `grep -rn ": Actions<\|as Actions<"`, poi `ng build` e `ng test`. |
| R2 | `RemoveAllSelected` tipizzato come `() => {type}` invece di `ActionCreator<string>` generico | `src/lib/models.ts:484` | **Possibile** (solo compilazione) | Le chiamate con argomenti (`RemoveAllSelected({})`, `RemoveAllSelected(null)`) non compilano più (TS2554). A runtime non cambia nulla. | Se il grep trova casi, ripristinare `ActionCreator<string>` oppure correggere le chiamate nei consumer. | `grep -rn "RemoveAllSelected(" src \| grep -v "RemoveAllSelected()"` |
| R3 | `DeleteSuccess`, `DeleteManySuccess` e `Delete` ora **rimuovono davvero** gli id cancellati da `idsSelected`/`entitiesSelected` e trattano gli id `0`/`''` come validi | `src/lib/reducer.ts:175-257` | **Comportamentale** (è un bug fix) | Prima, dopo `DeleteSuccess` la selezione multipla conteneva solo l'id cancellato; dopo `DeleteManySuccess` restavano selezionati anche gli elementi cancellati (`id in ids` controllava gli indici). Ora le selezioni non coinvolte restano. Contatori "N selezionati", pulsanti abilitati dalla selezione e logiche che contavano sull'azzeramento cambiano. Con id numerico `0` selezionato, `itemSelected` ora resta valorizzato. | Nota nel CHANGELOG / guida di migrazione. **Non** ripristinare il vecchio comportamento. | Manuale in un'app consumer: selezionare 3 righe, cancellarne 1 (singolo) e poi 2 (multiplo), verificare contatore, pulsanti e `itemSelected`. Unit test sulla libreria già presenti (`reducer-delete-selected.spec.ts`). |
| R4 | Nuovi tipi di azione `[<name>] Restore Request/Success/Failure` | `src/lib/actions.ts:20-22` | **Possibile, improbabile** | Collisione solo se un consumer ha definito a mano azioni con la stessa stringa (con `strictActionTypeUniqueness` attivo si ha un errore all'avvio). | Nessuna. | Avvio dell'app in dev con i runtime check di NgRx attivi. |
| R5 | Lo schematic `store` **non patcha più** `root-store/selectors.ts` (rimossi `addRootSelector`/`addLine`) | `schematics/store/index.ts:62-95`, `schematics/my-utility.ts` | **Comportamentale**, sul codice generato | Nei progetti creati con il vecchio `ng-add`, gli store generati da ora in poi **non entrano** nel loading/error globale (il vecchio `selectors.ts` elenca gli store a mano). Nessun errore: semplicemente lo spinner globale non si accende. | Guida di migrazione: sostituire `root-store/selectors.ts` con il nuovo template agnostico (dopo P8), oppure aggiungere a mano le righe `XxxStoreSelectors.selectIsLoading/selectError`. | In un progetto esistente: `ng g ngrx-entity-crud:store --clazz=Prova`, lanciare una `SearchRequest` lenta e verificare che il loading globale si accenda. |
| R6 | Schematic `auth0` **rimosso** da `collection.json` | `schematics/collection.json` | **Breaking certa** per il comando | `ng g ngrx-entity-crud:auth0` fallisce ("schematic not found"). Il codice già generato non è toccato. | Nota nel CHANGELOG/README. | Verificare che script e documentazione interni non lo usino. |
| R7 | Due nuovi `x-prompt` nello schematic `store` (`registration`, `persist`) | `schematics/store/schema.json` | **Comportamentale** (CLI) | Le esecuzioni interattive fanno 2 domande in più. Chi lancia script senza `--interactive=false` si blocca in attesa di input. Default non interattivo: `eager`, `persist=false` (comportamento storico). | Documentare i flag. | Rilanciare gli script di scaffolding interni con `--registration=eager --persist=false`. |
| R8 | Template `section`: nuova lista con bozze (inline edit + `AddManySelected`), toolbar bozze, delete da `selectItemsSelectedOrigin` | `schematics/section/files/primeng/plural/...` | **Solo codice nuovo** | Le sezioni esistenti non cambiano. Rigenerare una sezione esistente sovrascrive le personalizzazioni. Mescolare file vecchi e nuovi porta al punto 9 dell'altra review. | Guida: "per adottare le bozze rigenera **tutti** i file della sezione, o almeno lista + pulsante delete". | Generare una sezione in un'app di prova Angular 16 + PrimeNG 16 e compilare. |
| R9 | Nuovi secondary entry point (`persistence`, `devtools`, `ui`, `form-clipboard`) e `primeng`/`primeicons` peerDeps **opzionali** | `package.json` | **Nessuna** per il core | Il core (`ngrx-entity-crud`) continua a importare solo `Injectable`/`isDevMode`. Gli entry point nuovi usano `signal`/`computed`/`inject` (Angular ≥ 16) e componenti standalone, mentre le peerDeps dichiarano `^11`. | Documentare "minimo Angular 16 per persistence/devtools/ui/form-clipboard". Il `minVersion` della partial compilation in `dist` è ≤ `14.0.0` (verificato: 48× `12.0.0`, 7× `14.0.0`). | In un'app **Angular 16.2.14 + PrimeNG 16**: importare ogni entry point, `ng build --configuration production`. |
| R10 | Schema IndexedDB `dbVersion: 2` (object store `sectionPrefs`) | `persistence/persistence-config.token.ts:9` | **Solo beta** | Chi ha passato `dbVersion: 1` esplicito in `provideNecPersistence` non ottiene mai `sectionPrefs`: `getSaveMode` rifiuta e il check restituisce `stats: null`, quindi il prompt di restore non compare mai. Con due schede di versioni diverse vale P2. | Documentare di non fissare `dbVersion`. In modo additivo: `Math.max(config.dbVersion, 2)`. | Browser con DB v1 già presente, poi aggiornamento dell'app: verificare che il prompt compaia. Test con due schede aperte (vecchia e nuova build). |

API **invariate** rispetto a `v19.2.6` (verificate con il diff): `public-api.ts`, tutti gli `effect-*.ts`, `BaseCrudService`/`BaseSingularCrudService`/`BaseCrudGqlService`, `state_selectors.ts`, `entity_state.ts`, `create_adapter.ts`, `filter.ts`/`j-ngrx-filter.ts`. `createCrudReducer` ora dichiara esplicitamente `ActionReducer<S>`, lo stesso tipo che prima era inferito.

---

## 4. Checklist dei test di regressione sui consumer (prima della stable)

Installazione: `npm run build` + `npm run link` (oppure `link:copy`) nel progetto consumer, **almeno** su un'app Angular 16.2.14 + PrimeNG 16 e su una Angular 19.

**Compilazione**
- [ ] `ng build --configuration production` senza errori TS (copre R1, R2, R9).
- [ ] `ng test` del consumer: verificare in particolare i mock di `Actions<T>` (R1).
- [ ] `grep` di R1 e R2 sul codice del consumer.

**Runtime del core (senza persistence)**
- [ ] Avvio in dev con i runtime check di NgRx attivi: nessun errore di unicità dei tipi (R4).
- [ ] Ricerca → selezione multipla → delete singolo → delete multiplo: contatori, pulsanti e `itemSelected` come atteso (R3).
- [ ] Delete con `Delete` sincrona su un elemento aperto in dettaglio: il comportamento deve essere **identico** a `v19.2.6` (per questo il punto 8 dell'altra review va rimandato).
- [ ] Errore HTTP forzato (500) su search/delete/createMany: verificare quale `*Failure` arriva e che il banner lo mostri (P6, P8).
- [ ] Servizi GraphQL, se usati: `data` valorizzato come prima (P7).

**Schematics su un progetto esistente**
- [ ] `ng g ngrx-entity-crud:store` nuovo store: registrazione in `root-store.module.ts` e presenza (o assenza documentata) nel loading globale (R5).
- [ ] Script di scaffolding non interattivi: nessun blocco su prompt (R7).
- [ ] `ng g ngrx-entity-crud:section` su un nuovo store: compila con PrimeNG 16 (R8).

**Persistence (se adottata)**
- [ ] Modifica cella → annulla entro 200 ms → reload: la bozza **non** deve ricomparire (P1).
- [ ] Modifica cella → nuova ricerca entro 200 ms → reload: nessun prompt fantasma o errore globale (P1).
- [ ] Deseleziona una riga con la checkbox → reload → Restore: la riga non deve tornare selezionata (P4).
- [ ] Store eager + `autoRestore`: aprire la route dopo l'avvio; il prompt "Restore" non deve comparire su dati già ripristinati (P3).
- [ ] Due schede con build diverse (DB v1 e v2): la persistenza funziona dopo aver chiuso la vecchia scheda, senza reload (P2).
- [ ] Navigazione privata / storage pieno: nessuno spinner bloccato (P2, punto 3 dell'altra review).

---

## Priorità consigliata

1. **Prima della stable, tutte sicure**: P1, P2 (con i punti 1-3 dell'altra review), P8, P9, P10, P14, punto 7 dell'altra review, e le note CHANGELOG/migrazione per R3, R5, R6, R7, R9.
2. **Da decidere**: P3 (reducer opzionale), P4 (semantica selezione = bozza).
3. **Non toccare in 19.x** (rischio regressione): P6, P11, P12, punto 8 dell'altra review; per P7 solo l'hook additivo.
