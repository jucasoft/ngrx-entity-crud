import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {Names} from './names';
import {reducer} from './reducer';
import {CoinStoreEffects} from './effects';
import {State} from './state';

export const INJECTION_TOKEN = new InjectionToken<ActionReducer<State>>(`${Names.NAME}-store Reducers`);

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
    EffectsModule.forFeature([CoinStoreEffects])
  ],
  providers: [CoinStoreEffects,
    {
      provide: INJECTION_TOKEN,
      useFactory: (): ActionReducer<State> => reducer
    }]
})
export class CoinStoreModule {
}
