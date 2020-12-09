import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {LoginMainComponent} from './login-main/login-main.component';
import {LoginRoutingModule} from './login-routing.module';
import {CardModule} from 'primeng/card';
import {ButtonModule} from 'primeng/button';
import {FormErrorMsgModule} from '@core/components/form-error-msg/form-error-msg.module';
import {InputTextModule} from 'primeng/inputtext';

@NgModule({
  declarations: [
    LoginMainComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    LoginRoutingModule,
    CardModule,
    ButtonModule,
    FormErrorMsgModule,
    InputTextModule
  ],
  providers: [],
  entryComponents: []
})
export class LoginModule {
}
