# Design: `sectionCheck` nello store invece che iniettato da Effects

Data: 2026-09-17
Stato: approvato, in attesa di piano di implementazione

## Problema

`NecRestoreSearchComponent` (`libs/ngrx-entity-crud/persistence/nec-restore-search.component.ts`) risolve
oggi la classe generata da `createPersistenceEffects` via `Injector.get(this.effects)` e legge
`effectsInstance.sectionCheck$`, un `ReplaySubject` interno alla classe Effects
(`libs/ngrx-entity-crud/persistence/nec-persistence-effects.ts`). Il componente riceve la classe Effects
come `@Input() effects!: Type<NecPersistenceEffects>`.

Questo è il pattern esplicitamente documentato in `ngrx-entity-crud-persistence-plan.md` (decisioni 9/11/12)
ma è un anti-pattern NgRx: un Effect non dovrebbe essere una fonte di stato letta direttamente da un
componente. Lo stato del check (`NecSectionStats` + `autoRestoreTriggered`) deve vivere nello store ed
essere esposto tramite un selector standard, come qualunque altro pezzo di stato della libreria.

Lo scope è limitato a `sectionCheck$`. `pendingWrites$` e `quotaWarning` restano come oggi (letti da
`NecPersistenceService`, non da un Effects) — non è il pattern contestato.

## Vincoli

- Siamo su `19.4.0-beta`, non ancora pubblicata come release stabile duratura: si può rompere l'interfaccia
  pubblica del modulo `persistence` senza shim di compatibilità.
- `models.ts` del modulo persistence resta agnostico dal core (`src/lib`) — vincolo preesistente, non
  toccato da questo redesign (il resto del modulo persistence già importa `Actions`/`ICriteria` dal core).
- Ogni sezione ha una `feature` (stringa) nota solo a generazione/runtime: qualunque selector/reducer deve
  essere una factory chiusa su quella stringa, non una `createFeatureSelector` statica a livello di libreria.

## Architettura

Tre factory affiancate nel modulo `ngrx-entity-crud/persistence`, tutte chiuse su `feature`, generate nello
stesso punto in cui oggi si chiama `createPersistenceEffects`:

- `createPersistenceReducer(feature)` → reducer NgRx standard per la slice `${feature}:persistence`.
  Registrato con un secondo `StoreModule.forFeature(...)` accanto a quello esistente della sezione.
- `createPersistenceEffects(config)` → firma invariata. Non espone più `sectionCheck$`/`ReplaySubject`: il
  check di freschezza diventa un'azione dispatchata (vedi Data flow).
- `createPersistenceSelectors(feature)` → ritorna `{ sectionCheck }`, un `MemoizedSelector` via
  `createFeatureSelector('${feature}:persistence')`.

`NecRestoreSearchComponent` perde `Injector` e `@Input() effects!: Type<NecPersistenceEffects>`; guadagna
`@Input() selectors!: NecPersistenceSelectors` e legge `store.select(this.selectors.sectionCheck)` invece di
risolvere una classe concreta.

## Data flow

Nuova azione, definita nel modulo `persistence`, con `type` scoped per feature (stesso meccanismo già usato
da `createCrudActions<T>(name)` nel core: ogni reducer di sezione riceve, tramite match sul `type`, solo le
proprie azioni, senza bisogno di filtrare `feature` a mano nel payload):

```
[${feature} Persistence] Section Check Success  →  { check: NecSectionCheck }
```

`autoRestoreCheckOn$` (il `defer(from(persistence.stats(feature)))` di Fase 0) smette di scrivere su un
`ReplaySubject` interno e diventa un effect che dispatcha `SectionCheckSuccess({check})`. Il reducer
intercetta l'azione e scrive `{stats, autoRestoreTriggered}` nella slice `${feature}:persistence`.

L'auto-dispatch di `RestoreRequest` (oggi fuso nello stesso `tap`/`map` di `autoRestoreCheckOn$`) si separa
in un secondo effect dedicato che ascolta `SectionCheckSuccess` e, se `check.autoRestoreTriggered`, dispatcha
`RestoreRequest`. Ogni effect fa una cosa sola: uno legge e pubblica il check, l'altro reagisce al check.
Nessun side-channel (`tap` su un subject esterno allo store) resta nel codice.

## File impattati

Modulo `libs/ngrx-entity-crud/persistence/`:
- `nec-persistence-effects.ts` — rimuove `sectionCheck$`/`ReplaySubject`/`NecSectionCheck` come superficie
  pubblica dell'Effects; `autoRestoreCheckOn$` dispatcha `SectionCheckSuccess`; nuovo effect
  `autoRestoreTriggerOn$` (nome indicativo) per `RestoreRequest`.
- nuovo `nec-persistence-actions.ts` — `createPersistenceCheckAction(feature)` (o funzione equivalente) che
  produce l'`ActionCreator` con `type` scoped, richiamata sia da `createPersistenceEffects` sia da
  `createPersistenceReducer` per garantire lo stesso `type` string.
- nuovo `nec-persistence-reducer.ts` — `createPersistenceReducer(feature)`, stato iniziale
  `NecPersistenceState = { check: NecSectionCheck | null }`.
- nuovo `nec-persistence-selectors.ts` — `createPersistenceSelectors(feature)`.
- `nec-restore-search.component.ts` — via `Injector`/`@Input() effects`; dentro `@Input() selectors`.
- `public-api.ts` — esporta le nuove factory e i nuovi tipi (`NecPersistenceState`,
  `NecPersistenceSelectors`).
- spec esistenti riscritti: `nec-persistence-effects.spec.ts`, `nec-restore-search.component.spec.ts`; nuovi
  spec per reducer e selectors.

Schematics — solo `schematics/store/files/crud-store/plural/__clazz@dasherize__-store/__clazz@dasherize__-store.module.ts`
referenzia oggi `createPersistenceEffects` (opt-in `--persist`, solo CRUD-PLURAL; `singular` non è
coinvolto): aggiunge la chiamata a `createPersistenceReducer`/`createPersistenceSelectors`, un secondo
`StoreModule.forFeature`, ed esporta `<Entity>PersistenceSelectors` al posto del commento su `[effects]`.
Non risulta oggi nessuno schematic che generi effettivamente `<nec-restore-search [effects]="...">` nel
markup di una sezione, quindi non c'è un secondo punto template da aggiornare per quel binding.

Documentazione: `ngrx-entity-crud-persistence-plan.md` va aggiornato nelle sezioni che descrivono le
decisioni 9/11/12 (oggi documentano esplicitamente il pattern Injector/Effects sostituito qui).

## Testing

- `nec-persistence-effects.spec.ts`: verificare che `autoRestoreCheckOn$` dispatchi `SectionCheckSuccess`
  (non più assert su un subject interno); verificare il nuovo effect di auto-restore separatamente
  (dispatcha `RestoreRequest` solo quando `autoRestoreTriggered` è `true`).
- Nuovo spec reducer: stato iniziale, transizione su `SectionCheckSuccess`.
- Nuovo spec selectors: `sectionCheck` legge correttamente dalla slice `${feature}:persistence`.
- `nec-restore-search.component.spec.ts`: sostituire il mock di `Injector`/classe Effects con un mock/stub
  dello `Store` (già presente nei test NgRx tipici della libreria) che emette `NecSectionCheck` tramite il
  selector iniettato.

## Fuori scope

- `pendingWrites$` e `quotaWarning` restano stream letti da `NecPersistenceService`, non toccati.
- Nessuno shim di retrocompatibilità con l'API attuale di `createPersistenceEffects`/`@Input() effects`.
