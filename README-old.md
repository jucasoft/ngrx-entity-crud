1) Generate RootStoreModule using the Angular CLI:
```
ng g module root-store —-flat false —-module app.module.ts
```
2) Generate RootState interface to represent the entire state of your application using the Angular CLI:
```
ng g interface root-store/root-state
```
This will create an interface named RootState but you will need to rename it to State inside the generated .ts file as we want to later on utilize this as RootStoreState.State


=== Create Coin Store Module ===

1) Generate CoinStoreModule feature module using the Angular CLI:

```
ng g module root-store/coin-store --flat false --module root-store/root-store.module.ts
```   

2) Names — Create an names.ts file in the app/root-store/coin-store directory:
```   
export class Names {
	static NAME = 'coin';
}
```   

3) Actions — Create an actions.ts file in the app/root-store/coin-store directory:

```   
import {adapter} from './state';
import {Names} from './names';

export const actions = adapter.createCrudActions(Names.NAME);

export const {
  SearchRequest,
  SearchFailure,
  SearchSuccess,
  DeleteRequest,
  DeleteFailure,
  DeleteSuccess,
  CreateRequest,
  CreateFailure,
  CreateSuccess,
  EditRequest,
  EditFailure,
  EditSuccess,
  Reset,
  Filters
} = actions;
```   

4) State — Create an state.ts file in the app/root-store/coin-store directory:
```   
import {Coin} from '@models/vo/coin';
import {createCrusEntityAdapter, EntityCrudAdapter, EntityCrudState} from 'ngrx-entity-crud';

export const adapter: EntityCrudAdapter<Coin> = createCrusEntityAdapter<Coin>({
  selectId: model => model.id
});

export interface State extends EntityCrudState<Coin> {
}

export const initialState: State = adapter.getInitialCrudState();

```   


5) Reducer — Create an reducer.ts file in the app/root-store/coin-store directory:
```   
import {actions} from './actions';
import {adapter, initialState} from './state';

export const featureReducer = adapter.createCrudReducer(initialState, actions);
```   


6)  — Selectors an selectors.ts file in the app/root-store/coin-store directory:
```   
import {createFeatureSelector, MemoizedSelector} from '@ngrx/store';

import {adapter, State} from './state';
import {Names} from './names';

export const selectState: MemoizedSelector<object, State> = createFeatureSelector<State>(Names.NAME);

export const {
  selectTotal,
  selectIds,
  selectEntities,
  selectFilters,
  selectError,
  selectIsLoading,
  selectIsLoaded,
  selectFilteredItems,
  selectAll
} = adapter.getCrudSelectors(selectState);
```   



7) Effects — Create an effects.ts file in the app/root-store/coin-store directory:
```   

```  

8) index — Create an index.ts file in the app/root-store/coin-store directory:
```   
import * as CoinStoreActions from './actions';
import * as CoinStoreSelectors from './selectors';
import * as CoinStoreState from './state';

export {
  CoinStoreModule
} from './coin-store.module';

export {
  CoinStoreActions,
  CoinStoreSelectors,
  CoinStoreState
};

```  

9) index — Create an index.d.ts file in the app/root-store/coin-store directory:
```   
import * as CoinStoreActions from './actions';
import * as CoinStoreSelectors from './selectors';
import * as CoinStoreState from './state';

export {
  CoinStoreModule
} from './coin-store.module';

export {
  CoinStoreActions,
  CoinStoreSelectors,
  CoinStoreState
};

```  









10) Update the app/root-store/coin-store/coin-store.module.ts with the following:
```   

```  

2)  — Create an .ts file in the app/root-store/coin-store directory:
```   
```   



=== CREATE CRUD SECTION ===

1) Create directory structure
```
- src
  - app
    - main
      - models
        - vo
        - api
      - pages
      - services 
    - root-store
```

2) Create CoinModule, go in to directory src/app/main/pages and create new module:
```
ng generate module Coin --routing=true --routingScope=Child
```

3) Import CoinModule in app.module.ts
```
@NgModule({
...
  imports: [
    ...
    CoinModule
    ...
  ],
...
})
```

4) Create CoinListComponent, go in to directory src/app/main/pages/ :
```
ng generate component CoinList --skipTests=true --inlineStyle=true --changeDetection=OnPush
```

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: PizzaListComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PizzaRoutingModule {
}


ng generate module Client --routing=true --routingScope=Child
