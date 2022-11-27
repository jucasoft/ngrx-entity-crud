import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {ThemeUiStoreNames} from './theme-ui-store.names';
import {ThemeUiStoreState} from './theme-ui-store.state';
import {EffectsModule} from '@ngrx/effects';
import {ThemeUiStoreEffects} from './theme-ui-store.effects';
import {featureReducer} from './theme-ui-store.reducer';

export const CLIENT_TOKEN = new InjectionToken<ActionReducer<ThemeUiStoreState>>(ThemeUiStoreNames.NAME + ' Reducers');

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(ThemeUiStoreNames.NAME, CLIENT_TOKEN),
    EffectsModule.forFeature([ThemeUiStoreEffects])
  ],
  declarations: [],
  providers: [ThemeUiStoreEffects,
    {
      provide: CLIENT_TOKEN,
      useFactory: (): ActionReducer<ThemeUiStoreState> => featureReducer
    }
  ]
})
export class ThemeUiStoreModule {
}
