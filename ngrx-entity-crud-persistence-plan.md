# ngrx-entity-crud — Persistenza locale ricerche + bozze (piano)

> Stato: **PIANO — nessuna implementazione**. Branch `19.4.0-beta`.
> Companion di `ngrx-entity-crud-dashboard-plan.md` (che ne riapre la "Fase 4 — meta-reducer di persistenza",
> lì dichiarata non necessaria perché il consumer usava `ngrx-store-idb`).

## Contesto / perché

Le app consumer persistono oggi parte dello store con due librerie esterne:

- **`ngrx-store-localstorage@16`** — sincrona, reidrata dentro il reducer a `@ngrx/store/init` e a
  `@ngrx/store/update-reducers` (per questo regge anche le feature lazy). Mantenuta, funziona.
- **`ngrx-store-idb@15`, forkato** — il fork serve solo ad allargare i peerDeps ad Angular 16. Codice non
  più mantenuto, salva lo stato come **blob unico** in un object store `idb-keyval` e reidrata dopo il
  bootstrap con un'action, lasciando al consumer la gestione della race. È questa che va sostituita.

Il caso d'uso reale non è "persistere lo store", è più specifico. Nelle pagine di ricerca (form sopra,
tabella sotto) l'utente cerca, ottiene N righe e poi **modifica le righe una ad una**. Le modifiche finiscono
in `entitiesSelected` (attributo nato per la selezione, riusato come **bozza locale**) e la tabella mostra la
voce di `entitiesSelected` al posto di quella di `entities`, evidenziando la riga. Quelle bozze non sono
ancora state inviate al server: se l'utente riapre l'applicazione deve ritrovare esattamente la situazione
precedente.

Da qui la constatazione che guida tutto il piano: **`entities` e `entitiesSelected` non sono due pezzi dello
stesso dato**, sono due categorie con valore e profilo di scrittura opposti.

| | `entities` (+ criteri) | `entitiesSelected` (bozze) |
|---|---|---|
| Natura | cache **rigenerabile** rifacendo la ricerca | lavoro dell'utente, **non rigenerabile** |
| Volume | grande (fino a decine di migliaia di righe) | piccolo (poche centinaia/migliaia) |
| Scritture | rara: una per `SearchSuccess` | altissima: una per modifica |
| Se la perdi | fastidio | danno |

Il blob unico di `ngrx-store-idb` tratta le due cose allo stesso modo: con 1.000 modifiche su 99.999 righe
riserializza e riscrive l'intero stato 1.000 volte.

## Decisioni prese (committente)

1. **Perimetro**: solo IndexedDB. `ngrx-store-localstorage@16` resta al suo posto (tema, preferenze, stato UI);
   se ne riparla dopo.
2. **Collocazione**: nuovo secondary entry-point **`ngrx-entity-crud/persistence`**, separato da `devtools`.
3. **Due tipi di record**: risultato della ricerca salvato **in blocco**, bozze salvate **una per entità**.
4. **Nessuna soglia**: il risultato della ricerca si salva **sempre**, qualunque sia la dimensione. La soglia
   era servita solo a giustificare un secondo percorso di ripristino (rilancio della ricerca sopra soglia):
   eliminandola sparisce quel ramo, e con esso le bozze orfane e il rischio più grave del piano. `count` e
   `bytes` restano misurati e mostrati, così la soglia è reintroducibile in un punto solo se mai servisse.
5. **Forma della bozza**: **entità intera**, esattamente com'è in `entitiesSelected`. Nessun diff, nessun
   baseline, nessun rilevamento conflitti.
6. **Nuova ricerca = azzeramento**: una `SearchRequest` cancella ricerca e bozze precedenti di quella sezione.
   È semantica voluta, non un incidente da neutralizzare.
7. **Niente Web Worker e niente astrazione driver**: codice diretto su IndexedDB, come i probe esistenti.
8. **Durabilità in chiusura**: solo dialog `beforeunload` quando ci sono scritture in volo. Nessuna coda,
   nessun journal di emergenza.
9. **UI**: componente **PrimeNG pronto** nella libreria, usando solo componenti con classe identica tra
   PrimeNG v16 e v19 (`p-button`, `p-tag`; **`p-message` escluso**).
10. **Action dedicate `Restore*`**, non il riuso di `SearchSuccess`. Leggere un blocco grande da IndexedDB non
    è istantaneo: serve il ciclo `Request`/`Success`/`Failure` come per ogni altra operazione, perché
    `isLoading` deve essere vero durante la lettura e tornare falso alla fine. In più elimina il campo
    marcatore che sarebbe servito a distinguere una `SearchSuccess` vera da una sintetica.

## Contesto rilevato nel codebase (vincoli)

- **Nessun layer di persistenza nel repo**: `libs/ngrx-entity-crud/package.json` ha `dependencies: {}` e
  `metaReducers` è vuoto nel template `ng-add/.../root-store/root-reducer.ts:8`. Il vincolo zero-dipendenze
  va mantenuto: niente `idb-keyval`, `Dexie`, `localForage`.
- **IndexedDB nativo già scritto e testato**: `devtools/probes/nec-indexeddb-probe.service.ts` (~330 righe)
  copre `open()` con timeout, `onblocked`, abort dell'upgrade per non creare DB per errore, `count()`,
  lettura a cursore con limite. Il nuovo layer ne riusa lo stile e le difese.
- **`entitiesSelected` è già un `Dictionary<T>`** (`src/lib/models.ts:290`), quindi mappa naturalmente a un
  record per entità. **`idsSelected` non va persistito**: il reducer lo ricalcola sempre come
  `Object.keys(entitiesSelected)` (`src/lib/reducer.ts:291`).
- **Il reset su ricerca esiste già**: `SearchRequest` riporta `entitiesSelected` a `initialState` salvo `mode`
  contenente `updateMany-selected` (`src/lib/reducer.ts:20-29`). La persistenza si limita a seguirlo.
- **Nessun merge da inventare**: la tabella mostra già `entitiesSelected` al posto di `entities`. Ripristinare
  significa ripopolare le due sezioni; l'override lo fa la UI come oggi. `mode:
  'upsertMany-updateMany-selected'` (`src/lib/reducer.ts:110-123`) resta invariato.
- **Il reducer è componibile**: `createCrudOns` restituisce gli `on(...)` da passare a `createReducer`, quindi
  gli handler di `Restore*` si aggiungono senza toccare quelli esistenti, e `restoreSuccessOn` può condividere
  la logica di `searchSuccessOn` invece di duplicarla.
- **La chiave dell'entità è `selectId`**, statico sul modello generato
  (`schematics/store/files/crud-model/__clazz@dasherize__.ts:7`): va passato nella configurazione della sezione,
  perché a runtime lo stato non porta con sé quella funzione.
- **La chiave di slice è `Names.NAME`**, usata in `StoreModule.forFeature(Names.NAME, INJECTION_TOKEN)`
  (`schematics/store/files/crud-store/plural/.../*-store.module.ts:15`): è il punto in cui la persistenza della
  sezione si registra, quindi funziona identica per store eager e lazy.
- **Secondary entry-point**: `devtools/` è una cartella di primo livello sotto `libs/ngrx-entity-crud/` con un
  `ng-package.json` di due righe (`{lib: {entryFile: 'public-api.ts'}}`). `persistence/` segue lo stesso schema
  e viene rilevato automaticamente da ng-packagr.
- **Compatibilità Angular 16** (peerDeps da `^11.0.0`): serve API `NgModule` (`forRoot`), non solo funzioni
  `provide*`; nessun signal, niente `@if`/`@for` nei template.
- **`fake-indexeddb` non è installato**: va aggiunto alle devDependencies del workspace per i test Jest.

## Architettura

### Modello dati IndexedDB

Un database `nec-persistence` (nome configurabile), versione 1, due object store.

**`search`** — un record per sezione, chiave = nome della feature:

```
key: "orders"
{ criteria: {...}, ids: [...], entities: {...}, count: 100, bytes: 84210, at: 1737980522 }
```

Scritto una sola volta per ricerca, su `SearchSuccess`, sempre e per intero. `bytes` viene calcolato lì (una
sola `JSON.stringify().length`) così il pulsante può dichiarare lo spazio occupato senza rileggere nulla.

**`drafts`** — un record per entità modificata, chiave composta, indice su `feature`:

```
key: ["orders", "42"]
{ feature: "orders", id: "42", item: {...}, at: 1737980611 }
```

Modificare una riga scrive **un solo record**. L'indice `feature` serve a contare le bozze di una sezione
(`index('feature').count()`, economico) e a cancellarle in blocco a cursore.

### Ciclo di vita per sezione

| Evento | Effetto su IndexedDB |
|---|---|
| `SearchRequest` | cancella `search[feature]` e tutti i `drafts` della feature |
| `SearchSuccess` | scrive il blocco completo |
| `AddManySelected`, `SelectItems` | `put` dei record toccati (debounce breve) |
| `RemoveManySelected`, `RemoveAllSelected` | `delete` dei record corrispondenti |
| `DeleteSuccess`, `DeleteManySuccess` | `delete` delle bozze degli id cancellati |
| `Restore*` | **nessuno** — il ripristino legge, non scrive |

Ne consegue che **una sezione contiene al massimo l'ultima ricerca e le sue bozze**: non si accumula storia,
e il problema "apro 7 sezioni e mi ritrovo migliaia di record" è contenuto dal reset-per-ricerca. La pulizia
periodica diventa un di più, non un requisito.

**Aggancio**: non un meta-reducer globale ma una **effect factory per sezione**,
`createPersistenceEffects<T>(config)`, registrata nell'`EffectsModule.forFeature` del module dello store —
lo stesso posto per store eager e lazy, quindi il problema "slice lazy registrata dopo la reidratazione"
non si pone. Gli effects leggono lo stato già ridotto con `withLatestFrom` e sono `{dispatch: false}`, tranne
quelli del ripristino.

### Ripristino: su gesto dell'utente, sempre da locale

Nessuna reidratazione al bootstrap. All'apertura della sezione il componente interroga IndexedDB per quella
feature e, se trova dati, offre il ripristino. Questo elimina in un colpo sia il bootstrap bloccante sia la
race condition di `ngrx-store-idb`.

Il ripristino ha **action proprie**, con lo stesso ciclo di ogni altra operazione della libreria:

| Action | Effetto sul reducer |
|---|---|
| `RestoreRequest()` | `isLoading: true`, `isLoaded: false`, `error: null` |
| `RestoreSuccess({items, selected, criteria})` | `setAll(items)` + `entitiesSelected` + `idsSelected` + `lastCriteria`, `isLoading: false`, `isLoaded: true` |
| `RestoreFailure({error})` | `isLoading: false`, `error` |

Motivi per cui sono dedicate e non un riuso di `SearchSuccess`:

- **`isLoading` durante la lettura.** Senza soglia il blocco può essere grande, quindi la lettura da IndexedDB
  è un caricamento vero: l'utente deve vedere lo spinner e vederlo sparire alla fine. Una `SearchSuccess`
  sintetica arriva a cose fatte e non lascia spazio a nessuno stato intermedio.
- **Nessun marcatore da inventare.** Riusando `SearchSuccess` servirebbe un campo per distinguere quella vera
  (che va persistita) da quella sintetica (che no), altrimenti l'effect riscriverebbe il blocco appena letto.
  Con un tipo di action distinto la differenza è nel tipo, e l'effect semplicemente non la ascolta.
- **Atomicità.** `RestoreSuccess` ripopola `entities` e `entitiesSelected` in un solo passaggio; la strada
  alternativa richiedeva `SearchSuccess` seguita da `AddManySelected`, con uno stato intermedio in cui i dati
  ci sono ma le bozze no.
- **Leggibilità in Redux DevTools**: un ripristino si distingue a colpo d'occhio da una ricerca.

Il ripristino è offline-capable per costruzione: il server non viene mai interpellato. E siccome la ricerca
non viene mai rilanciata, il set di entità ripristinato è per definizione lo stesso su cui le bozze sono nate —
**niente bozze orfane, niente merge, niente conflitti**.

**Il loader globale si aggancia da solo.** `isLoading`, `isLoaded` ed `error` sono gli stessi campi di
`EntityCrudBaseState` (`src/lib/models.ts:271-278`) che usano tutte le altre operazioni, e il `selectors.ts`
installato da `ng-add` in `root-store/` non conosce i domini: scandisce lo stato root e considera in
caricamento ogni slice che espone `isLoading === true` (`root-store/selectors.ts:36-53`). Quindi il loader
dell'applicazione si accende durante un ripristino da IndexedDB senza alcun collegamento aggiuntivo, e un
`RestoreFailure` (IndexedDB non disponibile, DB corrotto) finisce da solo nel `selectError` globale
(`root-store/selectors.ts:66-80`). Vale anche per le sezioni lazy, che è il motivo per cui quei selettori
sono agnostici.

`isLoading` copre la lettura, **non** il salvataggio: le scritture delle bozze restano segnalate dal contatore
e dall'icona di sync sul pulsante. Se alzassero `isLoading` della slice, ogni modifica di riga metterebbe la
tabella in stato di caricamento.

### Scritture e chiusura della finestra

- Debounce breve (default ~200 ms, configurabile) sulle `put` delle bozze, per non scrivere ad ogni carattere.
- Un **contatore di scritture in volo**, esposto come observable: alimenta sia l'icona di sync sul pulsante sia
  il listener `beforeunload`.
- `beforeunload` **registrato solo quando il contatore è > 0** e rimosso appena torna a zero: il dialog nativo
  compare unicamente se c'è davvero qualcosa a rischio, e non si penalizza la bfcache nel caso normale.
  Nessuna API permette di impedire la chiusura: se la pagina muore con una transazione in volo, quella
  transazione viene abortita — si perde al più l'ultima modifica, senza dati corrotti (atomicità di IDB).
- `navigator.storage.persist()` invocato una volta all'inizializzazione, per ridurre il rischio di eviction.

### Modifiche al core (`src/`)

Additive, nessuna rottura di comportamento esistente:

- `actions.ts` — `createCrudActions` produce anche `RestoreRequest` / `RestoreSuccess` / `RestoreFailure`.
- `models.ts` — i tre membri corrispondenti in `Actions<T>` (nota di versioning: chi implementasse
  `Actions<T>` a mano dovrebbe aggiungerli; per chi usa `createCrudActions`, cioè tutti, è trasparente).
- `reducer.ts` — `createCrudOns` include `restoreRequestOn` / `restoreSuccessOn` / `restoreFailureOn`, con
  `restoreSuccessOn` che riusa la logica di `searchSuccessOn` estendendola alle bozze.
- `public-api.ts` — invariato: esporta già questi moduli.

Le action vivono nel core perché sono generiche ("ripristina uno stato da una fonte esterna", come `Reset`) e
non conoscono IndexedDB: chi non usa la persistenza si ritrova tre action che non dispatcha mai. La
conseguenza pratica è che una sezione già generata diventa persistente **senza rigenerare nulla**: basta
registrare gli effects.

### API pubblica dell'entry-point

`libs/ngrx-entity-crud/persistence/` — NUOVA cartella, con `ng-package.json` + `public-api.ts`:

- `NecPersistenceModule.forRoot(config)` — compatibilità Angular 16; `provideNecPersistence(config)` come
  variante funzionale per chi è su Angular 15+.
- `NEC_PERSISTENCE_CONFIG` — `{dbName, dbVersion, debounceMs, enabled}`.
- `NecPersistenceService` — apertura DB e schema, `readSection(feature)`, `purgeSection(feature)`,
  `stats(feature)`, `pendingWrites$`.
- `createPersistenceEffects<T>({feature, selectId, actions})` — la effect factory: scrive sugli eventi della
  tabella del ciclo di vita, e traduce `RestoreRequest` in lettura da IndexedDB + `RestoreSuccess`/`Failure`.
- `NecRestoreSearchComponent` (`<nec-restore-search feature="orders">`) — vedi sotto.
- `provideNecIdbAdapterFromPersistence()` — implementa `NecIdbAdapter` (`devtools/idb-adapter.token.ts`) sul
  DB della persistenza, così la dashboard esistente smette di essere solo agnostica e mostra le sezioni con
  nomi e conteggi veri.

Il `package.json` della libreria resta con `dependencies: {}`.

### Componente

`<nec-restore-search>` wrappa il pulsante Search della sezione, con quattro stati:

1. **niente in locale** → normale pulsante Search;
2. **dati locali presenti** → `"100 risultati salvati, 12 modifiche non inviate, 340 KB — ieri 18:42"` con
   `Ripristina` (dispatcha `RestoreRequest`) / `Nuova ricerca` (con conferma, perché butta via lavoro non
   inviato);
3. **attività in corso** → spinner durante il ripristino (da `isLoading` della slice), icona di sync durante
   i salvataggi (dal contatore);
4. **quota quasi esaurita** → avviso da `navigator.storage.estimate()`.

Solo `p-button` e `p-tag` (classi identiche tra PrimeNG v16 e v19), `primeng` è già `peerDependency`
opzionale. Le cifre vengono da `stats(feature)`: `count` e `bytes` dal record `search`, numero bozze da
`index('feature').count()`. Nessuna lettura integrale degli store per disegnare il pulsante.

## Cosa questo piano NON fa

- Non sostituisce `ngrx-store-localstorage` (decisione 1).
- Non introduce soglie né percorsi di ripristino alternativi (decisione 4).
- Non introduce diff, baseline, rilevamento conflitti o UI di merge (decisione 5).
- Non introduce Web Worker né un'astrazione driver (decisione 7).
- Non introduce coda persistente o journal di emergenza (decisione 8).
- Non sincronizza più tab (Web Locks): valutabile in seguito se emergono conflitti reali.
- Non cifra i dati: in IndexedDB finiscono dati di business in chiaro, come già oggi con `ngrx-store-idb`.

## Prerequisito — correzione della famiglia `delete` in `reducer.ts` ✅ FATTO

> Applicato: `src/lib/reducer.ts` corretto nei punti sotto + 20 test in
> `src/test/reducer-delete-selected.spec.ts`. `npm run testLibs` verde (235 test, 16 suite),
> `npm run lint` senza errori. Resta da verificare sul campo nelle app il cambio di comportamento
> descritto sotto.


Quattro punti trattano la selezione al contrario. Oggi il difetto è quasi invisibile perché si manifesta
**solo cancellando mentre ci sono elementi in `entitiesSelected`**: senza selezione attiva il codice sbagliato
produce comunque il risultato giusto. Con le bozze persistenti quello scenario diventa la norma.

| Riga | Codice attuale | Effetto reale | Correzione |
|---|---|---|---|
| `138` (`deleteSuccessOn`) | `filter((idA) => idA === id)` | tiene **solo** l'id cancellato e scarta tutte le altre bozze | `!==` |
| `167` (`deleteManySuccessOn`) | `filter((id) => !(id in ids))` | `in` su un array verifica gli **indici**, non i valori: con id stringa non toglie nulla, con id numerici piccoli toglie l'elemento sbagliato | `!ids.map(String).includes(String(id))`, come già fa `removeManySelectedOn` (`reducer.ts:303`) |
| `174` (`deleteManySuccessOn`) | `state.idSelected in ids` | stesso problema di `in` sull'array | confronto stringificato con `includes` |
| `193` (`deleteOn`) | `filter((idA) => idA === id)`, senza toccare `entitiesSelected` | stesso rovesciamento, **più** `idsSelected` ed `entitiesSelected` che restano disallineati | `!==` e ricostruzione coerente di `entitiesSelected` |

**Cambio di comportamento da verificare nelle app**: oggi una cancellazione azzera la selezione multipla; dopo
la correzione la selezione sopravvive, meno l'elemento cancellato. È il comportamento atteso, ma se una
schermata si appoggia inconsapevolmente a quel reset, cambia. Verifica: cercare gli usi di `idsSelected` /
`selectItemsSelected` in combinazione con le azioni di Delete.

Test in `src/test/` (dove stanno già `lazy-report.spec.ts` e `dashboard.spec.ts`), uno per riga corretta:

- `DeleteSuccess` con 3 bozze, cancellando un id **non** in bozza → restano 3;
- `DeleteSuccess` con 3 bozze, cancellando un id **in** bozza → restano 2, senza quello;
- `DeleteManySuccess` con id stringa non numerica → toglie solo i cancellati;
- `DeleteManySuccess` con id numerici piccoli (`0`, `1`) → non tocca elementi estranei;
- `Delete` locale → `idsSelected` e `Object.keys(entitiesSelected)` restano allineati;
- in tutti i casi, `idSelected` e `itemSelected` azzerati solo se l'elemento cancellato era quello selezionato.

**Difetto emerso dai test e corretto in un secondo passaggio**: le guardie `!!state.idSelected` e
`!idSelected` trattano `0` come "nessuna selezione", perché è falsy pur essendo un id valido. Ne
derivavano due effetti opposti — `itemSelected` azzerato anche quando la selezione andava conservata, e
`idSelected` **mai** azzerato quando l'elemento cancellato era proprio quello con id `0`. Introdotto un
helper non esportato `hasId(value)` (`value !== null && value !== undefined`) usato in tutti e tre gli
handler, e allineato il confronto `idSelected` vs id dell'action al confronto stringificato (prima
`2 === '2'` era false, quindi cancellando l'elemento selezionato la selezione restava appesa).

## Fasi

- **Fase 0 — entry-point + servizio IDB.** `persistence/` con `ng-package.json`, apertura DB, schema a due
  object store, `put`/`get`/`delete`/purge per feature, contatore scritture, `beforeunload` condizionale.
  Test Jest con `fake-indexeddb` (da aggiungere alle devDependencies). De-risk: verificare che ng-packagr
  emetta `dist/ngrx-entity-crud/persistence` e che `npm run build` + `build:schematics` restino integri.
- **Fase 1 — action e reducer nel core.** `Restore*` in `actions.ts`/`models.ts`/`reducer.ts`, con test sul
  reducer (isLoading, ripopolamento di entities + entitiesSelected + lastCriteria).
- **Fase 2 — effect factory.** `createPersistenceEffects` con la tabella del ciclo di vita, il debounce e la
  traduzione di `RestoreRequest` in lettura. Test sul comportamento delle azioni, non sull'I/O.
- **Fase 3 — componente.** `<nec-restore-search>` con i quattro stati.
- **Fase 4 — integrazione.** `provideNecIdbAdapterFromPersistence()` per la dashboard, pannello sezioni con
  purge esplicito in `<nec-dashboard>`, opzione `--persist` negli schematics `store`/`section` per generare
  la registrazione degli effects, README + ricetta in `TEST.md`.
- **Fase 5 — dopo la validazione sul campo.** Rimozione del fork di `ngrx-store-idb` dalle app; valutazione
  se assorbire anche `ngrx-store-localstorage`; eventuale Web Locks per il multi-tab.

## Rischi

- **Costo di scrittura del blocco grande.** Senza soglia, al `SearchSuccess` di una ricerca molto ampia si
  paga la serializzazione sul main thread (ordine dei centinaia di ms su decine di migliaia di righe). È
  mascherato dal fatto che avviene subito dopo l'attesa della risposta del server, ma va **misurato**
  (`PerformanceObserver` su `longtask`) sulle sezioni più pesanti. Se emerge, la soglia si reintroduce come
  un `if` nell'effect di `SearchSuccess`: `count` e `bytes` sono già lì.
- **Simmetrico in lettura**: anche `RestoreRequest` su un blocco grande costa. È il motivo per cui `isLoading`
  esiste, ma va comunque misurato: oltre una certa dimensione il ripristino va reso percepibile
  (progressivo o annunciato), non solo segnalato con uno spinner.
- **Famiglia `delete` in `reducer.ts`** (righe 138, 167, 174, 193): vedi *Prerequisito*. Il rischio non è
  correggerla, è il cambio di comportamento sulla selezione multipla dopo una cancellazione, da verificare
  nelle app. In ogni caso l'effect su `DeleteSuccess` esegue un `delete` mirato sull'id cancellato e non
  rispecchia `entitiesSelected`, quindi la persistenza resta corretta anche se qualcosa sfuggisse.
- **Quota ed eviction**: `persist()` è una richiesta, non una garanzia; `estimate()` è aggregata per origine e
  arrotondata (già documentato nel piano dashboard). Con più sezioni ampie salvate per intero, il pannello
  della dashboard con purge esplicito diventa la valvola di sfogo.
- **PrimeNG v16 vs v19**: attenersi ai soli componenti con classe identica, `p-message` escluso.
- **Superficie pubblica**: tre action in più nel core e un secondo entry-point esportato vanno versionati con
  attenzione (single source: `libs/ngrx-entity-crud/package.json`).

## Verifica

1. `npm run testLibs` — unit test del reducer (`Restore*`), degli effects (azioni sintetiche) e del servizio
   (`fake-indexeddb`).
2. `npm run build` — controllare che `dist/ngrx-entity-crud/persistence` sia emesso e che
   `build:schematics` non si rompa.
3. `npm run link` verso l'app consumer, poi sul campo, in una sezione reale:
   ricerca → modifica di alcune righe → chiusura del browser → riapertura → il pulsante annuncia i dati
   locali → `Ripristina` → la tabella torna identica, grassetti compresi.
4. Ripetere il punto 3 **con il backend spento**: il ripristino deve funzionare comunque.
5. Durante il `Ripristina` verificare che lo spinner compaia e sparisca (`isLoading`), e che il contatore
   delle scritture resti fermo: il ripristino legge e basta.
6. `Nuova ricerca` → verificare che `search` e `drafts` della sezione spariscano da IndexedDB (DevTools →
   Application, o il pannello di `<nec-dashboard>`).
7. Chiusura della finestra durante una raffica di modifiche → il dialog compare solo se c'è una scrittura in
   volo, e alla riapertura le modifiche precedenti sono tutte presenti.
8. Misurare i tempi di `SearchSuccess` (scrittura) e `RestoreRequest` (lettura) sulla sezione con più righe,
   per sapere se e quando la soglia andrà reintrodotta.
