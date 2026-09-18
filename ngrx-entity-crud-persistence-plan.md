# ngrx-entity-crud — Persistenza locale ricerche + bozze (piano)

> Stato: **IN CORSO — Fasi 0-4 completate** (`persistence/`: entry-point + servizio IDB + effect factory +
> componente `<nec-restore-search>` + integrazione dashboard/schematics/doc; `Restore*` nel core). Due
> riduzioni di scope deliberate in Fase 4 (vedi sotto). Fase 5 resta per dopo la validazione sul campo.
> Branch `19.4.0-beta`.
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
11. **Check di freschezza agganciato alla creazione della sezione dello store**, non all'apertura del
    componente. `createPersistenceEffects` esegue una lettura leggera (`stats(feature)`: metadati soltanto,
    non il blob) appena gli effects della feature vengono registrati — stesso istante per store eager e lazy.
    Il componente non ripete la query: legge l'esito già disponibile.
12. **Soglia di età configurabile (`autoRestore.maxAgeMs`, opzionale `maxBytes`) per decidere se il ripristino
    parte da solo o resta un gesto esplicito.** Opt-in, per sezione: se non impostata, il comportamento resta
    quello della decisione 10 (sempre gesto esplicito). Serve a distinguere sezioni con dati volatili (dove un
    ripristino silenzioso di dati vecchi sarebbe un problema) da sezioni con bozze costose da rifare (dove
    aspettare un click in più è solo attrito).

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

Un database `nec-persistence` (nome configurabile), versione 1, **tre** object store (la terza, `meta`, è
emersa implementando la Fase 0 — vedi nota sotto).

**`search`** — un record per sezione, chiave = nome della feature:

```
key: "orders"
{ criteria: {...}, ids: [...], entities: {...}, count: 100, bytes: 84210, at: 1737980522 }
```

Scritto una sola volta per ricerca, su `SearchSuccess`, sempre e per intero. `bytes` viene calcolato lì (una
sola `JSON.stringify().length`) così il pulsante può dichiarare lo spazio occupato senza rileggere nulla.

**`meta`** — un record per sezione, chiave = nome della feature, **separato** dal blob `search`:

```
key: "orders"
{ feature: "orders", count: 100, bytes: 84210, draftCount: 3, at: 1737980522 }
```

> **Nota (emersa in Fase 0)**: la decisione 11 chiede che il check di freschezza sia una lettura *leggera*,
> "non il blob". Ma IndexedDB non supporta letture parziali di un record: una `get()` su `search[feature]`
> forza comunque la deserializzazione dell'intero `entities`, qualunque sia la dimensione — esattamente il
> costo che il check dovrebbe evitare (vedi *Rischi*, "simmetrico in lettura"). `meta` risolve la
> contraddizione: `stats(feature)` legge solo questo record (quattro numeri), mai `search`. Scritto nella
> stessa transazione di `search` su `SearchSuccess`; `draftCount` si aggiorna in scrittura ad ogni
> put/delete di bozza via `index('feature').count()` su `drafts` (economico, non tocca `entities`), non
> ricalcolato ad ogni lettura.

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
| `SearchRequest` | cancella `search[feature]`, `meta[feature]` e tutti i `drafts` della feature |
| `SearchSuccess` | scrive il blocco completo (`search[feature]` + `meta[feature]`, stessa transazione) |
| `AddManySelected`, `SelectItems` | `put` dei record toccati in `drafts` (debounce breve) + `draftCount` in `meta` |
| `RemoveManySelected`, `RemoveAllSelected` | `delete` dei record corrispondenti in `drafts` + `draftCount` in `meta` |
| `DeleteSuccess`, `DeleteManySuccess` | `delete` delle bozze degli id cancellati + `draftCount` in `meta` |
| `Restore*` | **nessuno** — il ripristino legge, non scrive |

A questi eventi si aggiunge, alla creazione della sezione (non un'action, un side-effect della registrazione
degli effects), la lettura leggera `stats(feature)` che decide auto-restore vs prompt — vedi la sezione
successiva.

Ne consegue che **una sezione contiene al massimo l'ultima ricerca e le sue bozze**: non si accumula storia,
e il problema "apro 7 sezioni e mi ritrovo migliaia di record" è contenuto dal reset-per-ricerca. La pulizia
periodica diventa un di più, non un requisito.

**Aggancio**: non un meta-reducer globale ma una **effect factory per sezione**,
`createPersistenceEffects<T>(config)`, registrata nell'`EffectsModule.forFeature` del module dello store —
lo stesso posto per store eager e lazy, quindi il problema "slice lazy registrata dopo la reidratazione"
non si pone. Gli effects leggono lo stato già ridotto con `withLatestFrom` e sono `{dispatch: false}`, tranne
quelli del ripristino. È lo stesso hook a cui si aggancia il check leggero di freschezza descritto sotto: la
lettura di `stats(feature)` avviene quando la sezione (eager o lazy) viene creata, non quando l'utente apre
il componente — per una sezione lazy, quindi, nel momento in cui l'utente ci naviga e il modulo si carica.

### Ripristino: check leggero automatico alla creazione della sezione, poi gesto esplicito (salvo auto-restore configurato)

Nessuna reidratazione al bootstrap dell'applicazione. Il trigger non è "il componente si monta e l'utente
guarda", ma la **creazione della sezione dello store**: appena `createPersistenceEffects` registra i suoi
effects, esegue una lettura di `stats(feature)` — solo metadati (`count`, `bytes`, numero bozze, `at`), **non**
il blob `entities`/`drafts`. È la stessa lettura economica già prevista per alimentare il pulsante, semplicemente
anticipata al momento della creazione della sezione invece che al mount del componente.

In base al risultato:

- **nessun dato locale** → nessuna azione, il pulsante Search si comporta come oggi;
- **dati locali entro `autoRestore.maxAgeMs`** (e sotto `autoRestore.maxBytes`, se impostato) → `RestoreRequest`
  viene dispatchato in automatico, senza intervento dell'utente: la sezione si apre già con i suoi dati;
- **dati locali fuori soglia, o `autoRestore` non configurato per quella sezione (default)** → nessun dispatch
  automatico: il componente mostra il riepilogo e il ripristino resta un gesto esplicito, come nella versione
  precedente di questo piano.

`autoRestore` è **opt-in e per sezione**: se il consumer non lo configura, il comportamento è quello già
deciso (sempre gesto esplicito) — l'introduzione della soglia non cambia nulla per chi non la usa. La soglia
"giusta" non è la stessa per tutte le sezioni: un catalogo che cambia in continuazione può restare a gesto
esplicito, una sezione con bozze lunghe da ricostruire può accettare una soglia larga.

Il ripristino, automatico o manuale che sia, usa sempre le stesse **action dedicate**, con lo stesso ciclo di
ogni altra operazione della libreria:

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

### Modifiche al core (`src/`) — Fase 1 ✅ FATTO

Additive, nessuna rottura di comportamento esistente:

- `actions.ts` — `createCrudActions` produce anche `RestoreRequest` / `RestoreSuccess` / `RestoreFailure`
  (nuovo `CrudEnum.RESTORE = 'Restore'`, stesso schema di tipo `[name] Restore Request/Success/Failure`).
- `models.ts` — i tre membri corrispondenti in `Actions<T>`, non in `SingularActions<T>` (il ripristino
  riguarda solo lo stato collezione, non ha senso per il singular) (nota di versioning: chi implementasse
  `Actions<T>` a mano dovrebbe aggiungerli; per chi usa `createCrudActions`, cioè tutti, è trasparente).
- `reducer.ts` — `createCrudOns` include `restoreRequestOn` / `restoreSuccessOn` / `restoreFailureOn`.
  **Non** è codice condiviso con `searchSuccessOn` (la formulazione originale del piano qui era imprecisa):
  `restoreSuccessOn` è più semplice, perché non deve interpretare nessun `mode` di `ICriteria` — quello che
  arriva da IndexedDB è già lo stato salvato per intero, sempre `adapter.setAll(items)` +
  `entitiesSelected`/`idsSelected` ricostruiti da `selected` via lo stesso `toDictionary` già usato da
  `selectItemsOn`/`addManySelectedOn`.
- `public-api.ts` — invariato: esporta già questi moduli.

Le action vivono nel core perché sono generiche ("ripristina uno stato da una fonte esterna", come `Reset`) e
non conoscono IndexedDB: chi non usa la persistenza si ritrova tre action che non dispatcha mai. La
conseguenza pratica è che una sezione già generata diventa persistente **senza rigenerare nulla**: basta
registrare gli effects.

### API pubblica dell'entry-point

`libs/ngrx-entity-crud/persistence/` — cartella con `ng-package.json` + `public-api.ts` (Fasi 0-4 ✅ FATTO,
vedi *Fasi*):

- `NecPersistenceModule.forRoot(config)` — compatibilità Angular 16; `provideNecPersistence(config)` come
  variante funzionale per chi è su Angular 15+.
- `NEC_PERSISTENCE_CONFIG` — `{dbName, dbVersion, debounceMs, enabled, autoRestore?}`, con
  `autoRestore?: {maxAgeMs: number, maxBytes?: number}` come default globale. Opt-in: se assente, nessun
  ripristino automatico da nessuna parte — comportamento di default invariato rispetto alla versione
  precedente del piano.
- `NecPersistenceService` — apertura DB e schema (tre object store, vedi *Modello dati*):
  `writeSearch(feature, criteria, items, selectId)`, `purgeSection(feature)`,
  `putDrafts(feature, items, selectId)`, `deleteDrafts(feature, ids)`, `deleteAllDrafts(feature)`,
  `readSection(feature)` (blocco + bozze, per la traduzione di `RestoreRequest`), `stats(feature)` (solo
  `meta`, la lettura leggera del check di freschezza), `listSections()` (tutte le sezioni con dati locali,
  per il pannello dashboard), `pendingWrites$`, `estimateStorage()`. `enabled: false` rende ogni operazione
  un no-op. Ogni scrittura registra/deregistra da sé il listener `beforeunload` in base al contatore
  (decisione 8) e invoca `navigator.storage.persist()` una volta all'istanziazione.
- `createPersistenceEffects<T>({feature, selectId, actions, autoRestore?})` — la effect factory: scrive sugli
  eventi della tabella del ciclo di vita; alla creazione esegue il check leggero `stats(feature)` e, se rientra
  in `autoRestore` (parametro di sezione, prevale sul default globale di `NEC_PERSISTENCE_CONFIG`), dispatcha da
  sé `RestoreRequest`; traduce comunque `RestoreRequest` — che parta in automatico o dal componente — in
  lettura da IndexedDB + `RestoreSuccess`/`Failure`.
- `NecRestoreSearchComponent` (`<nec-restore-search [feature]="..." [effects]="..." [actions]="...">`) — vedi
  sotto.
- `provideNecIdbAdapterFromPersistence()` — implementa `NecIdbAdapter` (`devtools/idb-adapter.token.ts`) sopra
  `listSections()`, così la dashboard esistente smette di essere solo agnostica e mostra le sezioni con nomi
  e conteggi veri (un "database" virtuale per sezione, non il DB fisico unico — vedi *Fasi*).

Il `package.json` della libreria resta con `dependencies: {}`.

### Componente — Fase 3 ✅ FATTO

`<nec-restore-search>` wrappa il pulsante Search della sezione via content projection
(`<ng-content>`: i criteri della ricerca restano compito del form dell'app, fuori scopo qui). I cinque stati
del piano si sono rivelati, implementando, **quattro rami mutuamente esclusivi** più **due indicatori
indipendenti** mostrati insieme a uno qualsiasi dei quattro — coerente con la formulazione originale del
punto 4 ("spinner... **più** icona di sync"), che già li trattava come sovrapponibili:

1. **none** → contenuto proiettato (il normale pulsante Search), sia quando non c'è nulla in locale sia dopo
   un ripristino riuscito (automatico o manuale) o dopo "New search" confermata;
2. **auto-restoring** (solo se `autoRestore` è configurato per la sezione e i dati sono entro soglia) →
   spinner, senza chiedere conferma: dal punto di vista dell'utente la sezione si apre già con i suoi dati;
3. **prompt** — dati locali presenti, fuori soglia o `autoRestore` non configurato →
   `"100 results saved, 12 unsent changes, 340 KB — yesterday 18:42"` con `Restore` (dispatcha
   `RestoreRequest`) / `New search` (conferma inline stile Yes/Cancel — come il "Reset all" di
   `<nec-dashboard>`, niente `confirm()` nativo — perché butta via lavoro non inviato; alla conferma non
   dispatcha nulla lui stesso, torna allo stato `none` e lascia che sia la ricerca reale, quando l'utente la
   lancia, a far scattare la purge già prevista su `SearchRequest`);
4. **manual-restoring** → spinner sul pulsante `Restore` durante `isLoading` della slice;
   indicatori indipendenti, mostrati insieme a uno qualsiasi dei quattro rami sopra: icona di sync quando
   `pendingWrites$ > 0`, avviso quando `navigator.storage.estimate()` segnala quota quasi esaurita (chiamato
   una sola volta, non in polling).

La scelta tra i rami 1-3 è già decisa quando il componente si monta: legge `sectionCheck$` dalla classe
generata da `createPersistenceEffects`, risolta via `Injector` (il componente riceve la classe stessa come
`Input`, `[effects]="LaClasseGenerata"`, non una stringa) — stesso injector in cui `EffectsModule.forFeature`
l'ha registrata, quindi nessuna nuova query a `stats(feature)`.

Solo `p-button` e `p-tag` (classi identiche tra PrimeNG v16 e v19), `primeng` è già `peerDependency`
opzionale; il tipo di `severity` è comunque `string`-based anche in v19, quindi un valore come `warn` degrada
al più a un tag senza colore su una versione che non lo riconosce, non rompe nulla. Le cifre vengono da
`stats(feature)`: `count`, `bytes` e `draftCount` dal record `meta` (object store separato dal blob `search`,
introdotto in Fase 0 — vedi nota sotto). Nessuna lettura integrale degli store per disegnare il pulsante.

**Bug di logica intercettato prima dei test**: senza gestione dedicata, un `RestoreSuccess` sarebbe ricaduto
di nuovo nello stato `prompt` invece che in `none` (`check.stats` resta popolato, essendo l'esito di un check
fatto una sola volta alla creazione) — mostrando di nuovo "Restore" a dati già ripristinati. Corretto
riusando lo stesso segnale di "New search" confermata.

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

- **Fase 0 — entry-point + servizio IDB. ✅ FATTO** `persistence/` (`ng-package.json` + `public-api.ts`),
  `NecPersistenceService` con apertura/schema DB a **tre** object store (`search`, `meta`, `drafts` — la
  terza emersa in questa fase, vedi nota in *Modello dati*), `writeSearch`/`purgeSection`/`putDrafts`/
  `deleteDrafts`/`deleteAllDrafts`/`readSection`/`stats`/`estimateStorage`, contatore `pendingWrites$`,
  `beforeunload` condizionale, `enabled: false` come no-op globale, `NecPersistenceModule.forRoot` +
  `provideNecPersistence`. Test Jest con `fake-indexeddb` (aggiunto alle devDependencies: richiede anche un
  polyfill di `structuredClone` in `src/test-setup.ts`, assente nel global scope di
  `jest-environment-jsdom` anche su Node recenti — non un problema di questa libreria, ma dell'ambiente di
  test). `npm run testLibs` verde (274 test, 20 suite — 8 nuovi in più rispetto al prerequisito), `npm run
  lint` senza errori (0 warning nei file nuovi). De-risk verificato: `npm run build` emette
  `dist/ngrx-entity-crud/persistence` (ng-packagr lo scopre da sé, stesso meccanismo di `devtools`/`ui`) e
  `build:schematics` resta integro.
  **Bug reale intercettato dai test**: `deleteAllDrafts` inizialmente ricontava le bozze rimaste con
  `index('feature').count()` nella stessa transazione del cursore di cancellazione — ma IndexedDB esegue le
  request in ordine di *creazione*, non di completamento, quindi il conteggio veniva letto a cancellazione
  ancora in corso. Corretto azzerando `draftCount` direttamente (è cancellazione totale, il valore finale è
  noto a priori) invece di ricontare.
- **Fase 1 — action e reducer nel core. ✅ FATTO** `Restore*` in `actions.ts` (nuovo `CrudEnum.RESTORE`),
  `models.ts` (i tre membri in `Actions<T>`, non in `SingularActions<T>`: il ripristino riguarda solo lo
  stato collezione) e `reducer.ts` (`restoreRequestOn`/`restoreSuccessOn`/`restoreFailureOn`).
  `restoreSuccessOn` è sempre una sostituzione completa — niente `mode` da interpretare come in
  `searchSuccessOn`, perché quello che arriva da IndexedDB è già lo stato salvato per intero. 5 nuovi test in
  `src/test/reducer-restore.spec.ts` (isLoading/isLoaded/error nei tre casi, ripopolamento di entities +
  entitiesSelected + idsSelected + lastCriteria, sostituzione e non merge di entities). `npm run testLibs`
  verde (279 test, 21 suite), `npm run lint` senza errori, `npm run build` + `build:schematics` integri.
- **Fase 2 — effect factory. ✅ FATTO** `createPersistenceEffects<T>({feature, selectId, actions, autoRestore?})`
  in `persistence/nec-persistence-effects.ts`: genera dinamicamente una classe `@Injectable()` Effects, pronta
  per `EffectsModule.forFeature([createPersistenceEffects({...})])`. Copre l'intera tabella "Ciclo di vita per
  sezione" con effect `{dispatch: false}`, più `restoreRequestOn$` (traduce `RestoreRequest` in
  `readSection` + `RestoreSuccess`/`Failure`) e `autoRestoreCheckOn$` (il check leggero: gira una sola volta,
  perché `createEffect` sottoscrive l'observable non appena la classe viene istanziata da `EffectsModule` —
  stesso istante della creazione della sezione, eager o lazy — e dispatcha da sé `RestoreRequest` se
  `stats(feature)` rientra in `autoRestore`, di sezione o dal default globale). L'esito del check è esposto
  anche su `sectionCheck$` (`ReplaySubject`), cosi' il componente (Fase 3) lo legge senza ripetere la query.
  `draftsPutOn$` accumula in una `Map` gli item toccati durante la finestra di debounce e scrive un solo
  `putDrafts` con l'unione: un `debounceTime` semplice sull'azione avrebbe perso le righe intermedie quando
  due righe diverse vengono modificate nella stessa finestra.
  **Vincolo tecnico emerso implementando**: un secondary entry-point ng-packagr compila con `rootDir`
  ristretto alla propria cartella — un import relativo `../src/lib/models` fallisce (`TS6059`). L'unico modo
  per `persistence/` di referenziare `Actions<T>`/`ICriteria` del core è importarli tramite il **nome del
  pacchetto** (`from 'ngrx-entity-crud'`), risolto in build locale dal path-mapping già presente in
  `tsconfig.base.json` (`"ngrx-entity-crud": ["dist/ngrx-entity-crud"]` — per questo `persistence/` ora
  compila DOPO l'entry-point primario nell'ordine di ng-packagr). Sotto Jest, che non passa da `dist/`, serve
  lo stesso alias come `moduleNameMapper` in `jest.config.ts`, puntato però alla sorgente
  (`src/public-api.ts`) cosi' i test non dipendono da una build precedente. Questo è anche il motivo preciso
  per cui Fase 0 doveva restare agnostica dal core: non è (solo) una scelta di stile, è un vincolo del
  meccanismo di compilazione multi-entry-point.
  17 nuovi test in `persistence/nec-persistence-effects.spec.ts` (ogni riga della tabella del ciclo di vita,
  il merge nella finestra di debounce, i tre esiti di `RestoreRequest`, sette casi di soglia/precedenza per
  l'auto-restore). `npm run testLibs` verde (296 test, 22 suite), `npm run lint` senza errori, `npm run build`
  + `build:schematics` integri.
- **Fase 3 — componente. ✅ FATTO** `NecRestoreSearchComponent` (`persistence/nec-restore-search.component.ts`),
  standalone/OnPush, solo `p-button`+`p-tag` (`severity` è tipizzato `string`-based anche in v19, quindi un
  valore come `warn` degrada al più a un tag senza colore su v16, non rompe nulla). Wrappa il pulsante Search
  via content projection (`<ng-content>` per lo stato **none**): costruire i criteri della ricerca resta
  fuori scopo, è compito del form dell'app.
  I cinque stati del piano si riducono a **quattro rami mutuamente esclusivi** (`none`/`prompt`/
  `auto-restoring`/`manual-restoring`) più **due indicatori indipendenti** (icona di sync da `pendingWrites$`,
  avviso di quota da `estimateStorage()`, chiamato una sola volta) mostrati insieme a qualunque ramo — è la
  lettura più fedele della descrizione originale dello stato 4 ("spinner... **più** icona di sync"), che già
  trattava le due cose come sovrapponibili.
  Legge `sectionCheck$` dalla classe generata da `createPersistenceEffects` risolvendola via `Injector` (il
  componente riceve `[effects]="LaClasseGenerata"` come `Input`, non una stringa): stesso injector in cui
  `EffectsModule.forFeature` l'ha registrata, quindi nessuna nuova query a `stats(feature)`.
  "New search" (stato `prompt`) non dispatcha nulla lui stesso: mostra una conferma inline stile Yes/Cancel
  (come il "Reset all" di `<nec-dashboard>`, niente `confirm()` nativo) e poi torna allo stato `none`,
  lasciando che sia la ricerca reale dell'app — quando l'utente la lancia dal pulsante ora rivisibile — a far
  scattare la purge automatica già prevista su `SearchRequest`.
  **Bug di logica intercettato prima dei test**: un `RestoreSuccess` (automatico o manuale) senza gestione
  dedicata sarebbe ricaduto di nuovo nello stato `prompt` invece che in `none` (`check.stats` resta popolato,
  essendo l'esito di un check fatto una sola volta alla creazione) — mostrando di nuovo "Restore" a dati già
  ripristinati. Corretto riusando lo stesso segnale di "New search" confermata: un restore riuscito chiude il
  prompt.
  13 nuovi test in `nec-restore-search.component.spec.ts` (helper `formatBytes`/`formatAge` puri, più i
  quattro stati e i due indicatori via `TestBed`). Un dettaglio di RxJS ha richiesto di riscrivere l'approccio
  di test: `combineLatest` è cold e i `Subject` non-replay non ripetono ai nuovi iscritti i valori già
  emessi, quindi il primo tentativo (una nuova `.subscribe()` per ogni asserzione) restava in timeout —
  serve un'**unica sottoscrizione persistente** per test, e `pendingWrites$` nel doppio dev'essere una
  `BehaviorSubject` come lo è per davvero in `NecPersistenceService` (Fase 0), non un `Subject` semplice.
  `npm run testLibs` verde (312 test, 23 suite), `npm run lint` senza errori, `npm run build` +
  `build:schematics` integri.
- **Fase 4 — integrazione. ✅ FATTO (con due riduzioni di scope deliberate, vedi sotto)**
  - `NecPersistenceService.listSections()` — nuovo metodo (estensione di Fase 0): un cursore leggero
    sull'intero object store `meta`, per elencare tutte le sezioni con dati locali senza conoscerne i nomi
    in anticipo (a differenza di `stats(feature)`, mirato a una sezione).
  - `provideNecIdbAdapterFromPersistence()` — implementa `NecIdbAdapter` di `devtools/` sopra
    `NecPersistenceService.listSections()`: ogni sezione persistita diventa un "database" virtuale nel
    report di `<nec-dashboard>` (store `search`/`drafts` con i conteggi da `meta`), non il vero DB fisico
    unico. `devtools/` resta agnostico com'è: zero modifiche li', l'adapter vive in `persistence/` e importa
    `NEC_IDB_ADAPTER`/i tipi da `devtools/` tramite il nome del pacchetto (stesso meccanismo di Fase 2,
    `moduleNameMapper` aggiunto anche per `ngrx-entity-crud/devtools`).
  - Opzione **`--persist`** sullo schematic `store` (solo `--type=CRUD-PLURAL`: gli altri tipi non hanno
    `Restore*`/`entitiesSelected`; passata comunque viene ignorata con un warning nel log dello schematic,
    non un errore). Genera `createPersistenceEffects` nel modulo dello store, esportando
    `<Clazz>PersistenceEffects` — lo stesso pattern EJS (`<% if (persist) { %>`) già in uso nel resto degli
    schematics, verificato contro un template esistente che fa la stessa cosa
    (`schematics/dashboard/.../<clazz>.module.ts`).
  - README (`libs/ngrx-entity-crud/README.md`): nuova sezione "Secondary entry-point:
    `ngrx-entity-crud/persistence`" (setup, wiring per sezione, `<nec-restore-search>`, integrazione
    dashboard) più la documentazione di `--persist` nella sezione `store`. Ricetta aggiunta a `TEST.md`.

  **Riduzioni di scope deliberate rispetto alla formulazione originale** (rischio/complessità non
  giustificati per questo giro, senza un requisito esplicito a spingere oltre):
  - **Pannello sezioni con purge esplicito in `<nec-dashboard>`**: non implementato. `NecIdbAdapter` oggi
    espone solo lettura (`listDatabases`); aggiungere un'azione di purge avrebbe richiesto estendere
    quell'interfaccia pubblica (fattibile in modo additivo, un metodo opzionale) E modificare
    `nec-dashboard.component.ts` — un file già grande e ben collaudato — per un pulsante che duplica una
    funzionalità già raggiungibile (la sezione si svuota da sola alla prossima ricerca reale, per design).
    Il pannello mostra comunque le sezioni (nomi/conteggi) via `provideNecIdbAdapterFromPersistence()`.
  - **Opzione `--persist` sullo schematic `section`**: non implementata. La `section` non sa nulla del nome
    generato dalla `store` per la classe degli effects (le due schematics girano in invocazioni separate),
    quindi l'unico automatismo sensato sarebbe stato incollare `<nec-restore-search>` nel template HTML già
    in modifica per le bozze locali (`__clazz@dasherize__-main.component.html`, rischio di conflitto con
    lavoro in corso) — il README documenta il wiring manuale (poche righe, vedi sopra), preferito a un
    automatismo fragile.
- **Nota (revisione dopo Fase 4).** Il pattern di Fase 2/3 per `sectionCheck` — un Effect come fonte di
  stato, letto dal componente risolvendo la classe generata da `createPersistenceEffects` via `Injector`
  (`[effects]="LaClasseGenerata"`) — è stato sostituito: un Effect non deve essere una fonte di stato letta
  da un componente. `createPersistenceEffects` non espone più `sectionCheck$`/`ReplaySubject`;
  `autoRestoreCheckOn$` dispatcha `SectionCheckSuccess` (nuova azione con `type` scoped per `feature`,
  `nec-persistence-actions.ts`), un reducer dedicato (`createPersistenceReducer`, montato con un secondo
  `StoreModule.forFeature` su `necPersistenceFeatureKey(feature)`) lo scrive nello store, e
  `createPersistenceSelectors` lo espone al componente (`@Input() selectors` sostituisce `@Input() effects`
  + `Injector`). L'auto-dispatch di `RestoreRequest` è ora un effect separato (`autoRestoreTriggerOn$`) che
  ascolta `SectionCheckSuccess`. Vedi
  `docs/superpowers/specs/2026-09-17-persistence-section-check-store-design.md` per il design completo.
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
- **Auto-restore con soglia troppo larga**: se `autoRestore.maxAgeMs` è impostato troppo permissivo, l'utente
  può ritrovarsi dati vecchi senza accorgersene — esattamente il caso che il gesto esplicito evitava.
  Mitigato dal default assente (opt-in) e dal fatto che la soglia è per sezione: si attiva solo dove ha senso.

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
9. Con `autoRestore` configurato su una sezione: aprirla con dati locali entro soglia e verificare che il
   ripristino parta da solo (nessun click, spinner visibile, nessuna scrittura durante la lettura); superata
   la soglia (o su una sezione senza `autoRestore`), verificare che torni il comportamento a gesto esplicito
   del punto 3 dello stato del componente.
