#NGRX STORE

Generate RootStoreModule in src/app using the Angular CLI:
```
ng g module root-store —-flat false —-module app.module.ts
```
Generate RootState interface to represent the entire state of your application using the Angular CLI:
```
ng g interface root-store/root-state
```
This will create an interface named RootState but you will need to rename it to State inside the generated .ts file as we want to later on utilize this as RootStoreState.State


##Create Coin Store Module

Generate CoinStoreModule feature module using the Angular CLI:

```
ng g module root-store/coin-store --flat false --module root-store/root-store.module.ts
```   

Names — Create an names.ts file in the app/root-store/coin-store directory:
```   
touch root-store/coin-store/names.ts
```   
```   
export class Names {
	static NAME = 'coin';
}
```   

Actions — Create an actions.ts file in the app/root-store/coin-store directory:
```   
touch root-store/coin-store/actions.ts
```  
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

State — Create an state.ts file in the app/root-store/coin-store directory:
```   
touch root-store/coin-store/state.ts
```  
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

Reducer — Create an reducer.ts file in the app/root-store/coin-store directory:
```
touch root-store/coin-store/reducer.ts
```
```   
import {actions} from './actions';
import {adapter, initialState} from './state';

export const featureReducer = adapter.createCrudReducer(initialState, actions);
```   


Selectors - Create  an selectors.ts file in the app/root-store/coin-store directory:
```
touch root-store/coin-store/selectors.ts
```
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

Effects — Create an effects.ts file in the app/root-store/coin-store directory:
```
touch root-store/coin-store/effects.ts
```
```   
import {Injectable} from '@angular/core';
import {Actions, Effect} from '@ngrx/effects';
import {ofType, toPayload} from 'ts-action-operators';
import * as actions from './actions';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {CoinService} from '@services/coin.service';
import {of} from 'rxjs';

@Injectable()
export class CoinStoreEffects {
  @Effect()
  searchRequestEffect$ = this.actions$.pipe(
    tap(value => console.log('value', value)),
    ofType(actions.SearchRequest),
    tap(value => console.log('value', value)),
    toPayload(),
    switchMap(payload => {
      return this.service.search(payload).pipe(
        map(result => {
          return actions.SearchSuccess({items: result.data});
        }),
        catchError(error => {
            return of(actions.SearchFailure({error}));
          }
        )
      );
    }),
    tap(value => console.log('value', value)),
  );

  constructor(
    private service: CoinService,
    private readonly actions$: Actions) {
  }

}

```  

index — Create an index.ts and index.d.ts files in the app/root-store/coin-store directory:
```
touch root-store/coin-store/index.ts root-store/coin-store/index.d.ts 
```
same code for both files:
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
Update the app/root-store/coin-store/coin-store.module.ts with the following:

```
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {Names} from './names';
import {featureReducer} from './reducer';
import {CoinStoreEffects} from './effects';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    StoreModule.forFeature(Names.NAME, featureReducer),
    EffectsModule.forFeature([CoinStoreEffects])
  ]
})
export class CoinStoreModule { }
```

Update app/root-store/root-state.ts:
```
import {CoinStoreState} from './coin-store';

export interface State {
  coin: CoinStoreState.State;
}
```

Update your app/root-store/root-store.module.ts by importing all feature modules, and importing the following NgRx modules: StoreModule.forRoot({}) and EffectsModule.forRoot([]):

```
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoinStoreModule } from './coin-store';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CoinStoreModule,
    StoreModule.forRoot({}),
    EffectsModule.forRoot([])
  ]
})
export class RootStoreModule { }

```

Create an app/root-store/selectors.ts file. This will hold any root state level selectors, such as a Loading property, or even an aggregate Error property:
```
touch root-store/selectors.ts
```
```
import {createSelector, MemoizedSelector} from '@ngrx/store';
import {CoinStoreSelectors} from './coin-store';

export const selectError: MemoizedSelector<object, string> = createSelector(
  CoinStoreSelectors.selectError,
  (coin: string) => {
    return coin;
  }
);

export const selectIsLoading: MemoizedSelector<object,
  boolean> = createSelector(
  CoinStoreSelectors.selectIsLoading,
  (coin: boolean) => {
    return coin;
  }
);

```

Create an app/root-store/index.ts barrel export for your store with the following:
```
touch root-store/index.ts
```
```
import { RootStoreModule } from './root-store.module';
import * as RootStoreSelectors from './selectors';
import * as RootStoreState from './root-state';
export * from './coin-store';
export { RootStoreState, RootStoreSelectors, RootStoreModule };

```

#Wiring up the Root Store Module to your Application



completare da :
https://itnext.io/ngrx-best-practices-for-enterprise-angular-applications-6f00bcdf36d7
sezione:
Wiring up the Root Store Module to your Application
