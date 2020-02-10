import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {RouterStoreModule} from './router-store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../../../../../../../src/environments/environment';
import {reducers, metaReducers} from './root-reducer';

@NgModule({
  imports: [
    CommonModule,
    RouterStoreModule,
    StoreModule.forRoot(reducers, {metaReducers, runtimeChecks: {strictStateImmutability: true, strictActionImmutability: true}}),
    EffectsModule.forRoot([]),
    StoreDevtoolsModule.instrument({
      maxAge: 25, // Retains last 25 states
      logOnly: environment.production, // Restrict extension to log-only mode
    }),
  ],
  declarations: []
})
export class RootStoreModule {
}
