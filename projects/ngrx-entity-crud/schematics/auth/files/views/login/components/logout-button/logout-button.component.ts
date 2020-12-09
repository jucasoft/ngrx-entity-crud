import {ChangeDetectionStrategy, Component, NgModule, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {Observable} from 'rxjs';
import {AuthStoreActions, AuthStoreSelectors} from '@root-store/auth-store';

@Component({
  selector: 'app-logout-button',
  template: `
    <p-button label="Logout" [disabled]="(isLoggedIn$ | async) === false" (click)="logout()"></p-button>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoutButtonComponent implements OnInit {

  isLoggedIn$: Observable<boolean>;

  constructor(private readonly store$: Store) {
  }

  ngOnInit(): void {
    this.isLoggedIn$ = this.store$.pipe(
      select(AuthStoreSelectors.selectIsLoggedIn)
    );
  }

  logout(): void {
    this.store$.dispatch(AuthStoreActions.LogoutRequest());
  }
}

@NgModule({
  declarations: [
    LogoutButtonComponent
  ],
  exports: [
    LogoutButtonComponent
  ],
  imports: [
    CommonModule,
    ButtonModule
  ],
  providers: [],
  entryComponents: []
})
export class LogoutButtonModule {
}
