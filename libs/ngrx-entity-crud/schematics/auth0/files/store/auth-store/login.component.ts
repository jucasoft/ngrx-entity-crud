import {Component, NgModule, OnInit} from '@angular/core';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AuthStoreActions, AuthStoreSelectors} from './index';
import {CommonModule} from '@angular/common';
import {OverlayPanelModule} from 'primeng/overlaypanel';
import {SharedModule} from 'primeng/api';
import {CardModule} from 'primeng/card';
import {AvatarModule} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';

@Component({
  selector: 'app-login',
  template: `
    <p-overlayPanel #op>
      <ng-template pTemplate>
<!--        <p-card>
          <pre>{{ profile$ | async | json }}</pre>
          <button (click)="logout(); op.hide();">Logout</button>
        </p-card>-->
        <button pButton class="p-button-danger" (click)="logout(); op.hide();">Logout</button>
      </ng-template>
    </p-overlayPanel>
    <div>
      <div *ngIf="loggedIn$ | async as loggedIn; else loginContent">
        <p-avatar image="{{(profile$ | async).picture}}" shape="circle" (click)="op.toggle($event)"></p-avatar>
      </div>
      <ng-template #loginContent>
        <button pButton class="p-button-Primary" (click)="login()">Login</button>
      </ng-template>
    </div>
  `,
  styles: []
})
export class LoginComponent implements OnInit {

  title = 'auth0-angular-ngrx';

  loggedIn$: Observable<boolean>;
  profile$: Observable<any>;

  constructor(private store: Store<any>) {
  }

  ngOnInit(): void {
    this.loggedIn$ = this.store.pipe(select(AuthStoreSelectors.selectIsLoggedIn));
    this.profile$ = this.store.pipe(select(AuthStoreSelectors.selectCurrentUserProfile));
    this.store.dispatch(AuthStoreActions.CheckAuth());
  }

  logout(): void {
    this.store.dispatch(AuthStoreActions.LogoutResult());
  }

  login(): void {
    this.store.dispatch(AuthStoreActions.LoginRequest());
  }
}

@NgModule({
  imports: [
    CommonModule,
    OverlayPanelModule,
    SharedModule,
    CardModule,
    AvatarModule,
    ButtonModule,
  ],
  declarations: [LoginComponent],
  exports: [LoginComponent],
  providers: []
})
export class LoginModule {
}

