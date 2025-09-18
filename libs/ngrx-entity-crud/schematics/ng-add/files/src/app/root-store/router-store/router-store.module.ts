import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EffectsModule} from '@ngrx/effects';
import {RouterEffects} from './effects';
import {State} from './state';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {routerReducer, StoreRouterConnectingModule} from '@ngrx/router-store';
import {featureReducer} from './reducer';

export const INJECTION_TOKEN = new InjectionToken<ActionReducer<State>>(`router-store Reducers`);

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('router', INJECTION_TOKEN),
    EffectsModule.forFeature([RouterEffects]),
    StoreRouterConnectingModule.forRoot({stateKey: 'router'})
  ],
  declarations: [],
  providers: [
    RouterEffects,
    {
      provide: INJECTION_TOKEN,
      useFactory: (): ActionReducer<State> => featureReducer
    },
  ]

})
export class RouterStoreModule {
}
