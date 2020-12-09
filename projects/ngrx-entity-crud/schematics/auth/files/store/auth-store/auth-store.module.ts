import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {AuthStoreEffects} from './effects';
import {featureReducer} from './reducer';
import {Auth} from '@models/vo/auth';
import {Names} from './names';
import {State} from './state';
import {AuthService} from './auth.service';
import {AuthMockService} from './auth-mock.service';

export const INJECTION_TOKEN = new InjectionToken<ActionReducer<Auth>>(`${Names.NAME}-store Reducers`);

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
    EffectsModule.forFeature([AuthStoreEffects]),
  ],
  declarations: [],
  providers: [AuthStoreEffects,
    {
      provide: AuthService,
      useClass: AuthMockService
    },
    {
      provide: INJECTION_TOKEN,
      useFactory: (): ActionReducer<State> => featureReducer
    }
  ]
})
export class AuthStoreModule {
}
