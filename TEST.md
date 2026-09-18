ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD
ng generate ngrx-entity-crud:store --name=dog --clazz=Dog --type=BASE

auth
ng generate ngrx-entity-crud:auth
section
ng generate ngrx-entity-crud:section --clazz=Coin --lib=primeng
ng generate ngrx-entity-crud:section --clazz=Base --lib=no-libs

# la sezione primeng/plural include l'editing inline con bozze locali (entitiesSelected).
# giro di test dello store, in ordine:
# 1. modifica una cella: la riga si evidenzia (bozza) e la checkbox si accende -> AddManySelected
# 2. modifica una seconda riga: il contatore "Save drafts (N)" segue le sole righe sporche
# 3. "annulla bozza" sulla riga (icona pi-undo) -> RemoveManySelected, la riga torna al dato dello store
# 4. rilancia la ricerca: le bozze restano (SearchSuccess non azzera entitiesSelected)
#    con mode 'updateMany-selected' le bozze vengono riallineate ai dati freschi
# 5. "Save drafts" -> EditManyRequest con le sole righe modificate; a EditManySuccess lo stato si allinea
# 6. "Discard drafts" -> RemoveAllSelected, entitiesSelected e idsSelected tornano vuoti
# 7. "Delete (N)" lavora su selectItemsSelectedOrigin: cancella il dato dello store, non la bozza;
#    dopo DeleteManySuccess verifica che idsSelected/entitiesSelected non contengano id orfani
store
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD
ng generate ngrx-entity-crud:store --name=base --clazz=Base --type=BASE

lazy-report
ng generate ngrx-entity-crud:lazy-report --format=json --output=lazy-report.json

table-report
ng generate ngrx-entity-crud:table-report --format=json --output=table-report.json
ng generate ngrx-entity-crud:table-report --output=
# inventario di tutte le tabelle (ag-grid + p-table) con colonne estratte via AST

persistence (Fasi 0-4 di ngrx-entity-crud-persistence-plan.md)
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD-PLURAL --persist=true --registration=eager
# genera anche CoinPersistenceEffects nel modulo dello store (createPersistenceEffects):
# nessun'altra azione richiesta, gli effects scrivono da soli su IndexedDB seguendo il ciclo
# di vita della sezione (SearchRequest/SearchSuccess/AddManySelected/RemoveManySelected/...).
#
# per mostrare lo stato della persistenza nella UI, avvolgi il pulsante Search esistente:
#   import {NecPersistenceModule} from 'ngrx-entity-crud/persistence';  (una volta, in AppModule)
#   import {NecRestoreSearchComponent} from 'ngrx-entity-crud/persistence';
#   import {CoinPersistenceSelectors} from '@root-store/coin-store';
#   <nec-restore-search feature="coin" [selectors]="CoinPersistenceSelectors" [actions]="actions">
#     <button pButton label="Search" (click)="search()"></button>
#   </nec-restore-search>
#
# giro di test manuale, in ordine (vedi anche "Verifica" nel piano):
# 1. ricerca -> modifica alcune righe -> chiudi la scheda -> riapri: il pulsante annuncia
#    "N results saved, M unsent changes" -> Restore -> la tabella torna identica, grassetti compresi
# 2. ripeti col backend spento: il ripristino deve funzionare comunque (legge solo da locale)
# 3. durante "Restore" verifica che lo spinner compaia/sparisca e che il contatore di sync
#    resti fermo (il ripristino legge, non scrive)
# 4. "New search" -> conferma (Yes/Cancel inline) -> la ricerca reale successiva cancella
#    search+drafts della sezione (verificabile da DevTools -> Application -> IndexedDB -> nec-persistence)
# 5. imposta autoRestore sulla sezione (parametro di createPersistenceEffects) e riapri entro
#    la soglia: il ripristino parte da solo, nessun click, spinner visibile
# 6. chiusura della scheda durante una raffica di modifiche -> il dialog beforeunload compare
#    solo se c'e' una scrittura in volo
#
# per mostrare le sezioni persistite nella dashboard esistente (facoltativo):
#   providers: [provideNecIdbAdapterFromPersistence()]  // da 'ngrx-entity-crud/persistence',
#   accanto a NecPersistenceModule.forRoot({...})

dashboard
ng generate ngrx-entity-crud:dashboard
ng generate ngrx-entity-crud:dashboard --clazz=AdminPanel --include-lazy-report=false --include-table-report=false
ng generate ngrx-entity-crud:dashboard --include-scaffold=false
# poi aggiungi la rotta lazy (gia inserita in app-routing.module.ts) e naviga su /dashboard
# in alternativa, senza scaffolding, monta <nec-dashboard> da 'ngrx-entity-crud/devtools'
# il pannello Tables legge src/assets/table-report.json (generato insieme alla dashboard)
# il pannello Scaffold (<nec-scaffold>) genera il conf grm-schematics/conf/<entita>.json
# e i comandi ng generate della nuova sezione: incolla un DTO, spunta key/search, scarica il JSON
# il pannello Live grids compare solo se una griglia si registra a runtime:
# NecGridRegistryService.register('<key>', params.api, {store: '<slice>'}) in onGridReady
# (verifica: displayed vs entities, filtri/sort/selezione, azioni autosize/clear/deselect)

