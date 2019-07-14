import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CoinStoreModule} from './coin-store';
import {EffectsModule} from '@ngrx/effects';
import {ActionReducerMap, MetaReducer, StoreModule} from '@ngrx/store';
import {environment} from '../../environments/environment';
import {RouterStoreModule} from './router-store';

// creao uno store vuoto per poter utilizzare "storeFreeze"
// senza un reducer iniziale non posso passare il secondo parametro al StoreModule.forRoot(reducers, {metaReducers})
export const reducers: ActionReducerMap<{}> = {};
export const metaReducers: MetaReducer<{}>[] = !environment.production ? [] : [];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    CoinStoreModule,
    RouterStoreModule,
    StoreModule.forRoot(reducers, {metaReducers}),
    EffectsModule.forRoot([])
  ]
})
export class RootStoreModule {
}
