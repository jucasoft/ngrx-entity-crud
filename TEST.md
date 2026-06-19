ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD
ng generate ngrx-entity-crud:store --name=dog --clazz=Dog --type=BASE

auth
ng generate ngrx-entity-crud:auth
section
ng generate ngrx-entity-crud:section --clazz=Coin --lib=primeng
ng generate ngrx-entity-crud:section --clazz=Base --lib=no-libs
store
ng generate ngrx-entity-crud:store --name=coin --clazz=Coin --type=CRUD
ng generate ngrx-entity-crud:store --name=base --clazz=Base --type=BASE

lazy-report
ng generate ngrx-entity-crud:lazy-report --format=json --output=lazy-report.json

dashboard
ng generate ngrx-entity-crud:dashboard
ng generate ngrx-entity-crud:dashboard --clazz=AdminPanel --include-lazy-report=false
# poi aggiungi la rotta lazy (gia inserita in app-routing.module.ts) e naviga su /dashboard
# in alternativa, senza scaffolding, monta <nec-dashboard> da 'ngrx-entity-crud/devtools'

