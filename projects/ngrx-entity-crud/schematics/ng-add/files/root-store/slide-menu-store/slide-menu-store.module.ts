import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {Names} from './names';
import {State} from './state';
import {EffectsModule} from '@ngrx/effects';
import {SlideMenuStoreEffects} from './effects';
import {featureReducer} from './reducer';

export const CLIENT_TOKEN = new InjectionToken<ActionReducer<State>>(Names.NAME + ' Reducers');

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(Names.NAME, CLIENT_TOKEN),
    EffectsModule.forFeature([SlideMenuStoreEffects])
  ],
  declarations: [],
  providers: [SlideMenuStoreEffects,
    {
      provide: CLIENT_TOKEN,
      useFactory: (): ActionReducer<State> => featureReducer
    }
  ]
})
export class SlideMenuStoreModule {
}
