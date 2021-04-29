import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {AuthStoreEffects} from './effects';
import {featureReducer} from './reducer';
import {Names} from './names';
import {State} from './state';
import {AuthenticationService} from '@root-store/auth-store/authentication.service';
import {LoginModule} from './login.component';
import {Profile} from '@root-store/auth-store/profile';

export const INJECTION_TOKEN = new InjectionToken<ActionReducer<Profile>>(`${Names.NAME}-store Reducers`);

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
    EffectsModule.forFeature([AuthStoreEffects]),
    LoginModule,
  ],
  declarations: [],
  providers: [AuthStoreEffects,
    AuthenticationService,
    {
      provide: INJECTION_TOKEN,
      useFactory: (): ActionReducer<State> => featureReducer
    }
  ]
})
export class AuthStoreModule {
}
