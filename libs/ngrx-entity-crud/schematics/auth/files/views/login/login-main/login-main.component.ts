import {Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {AuthStoreActions, AuthStoreSelectors, RootStoreState} from '@root-store/index';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {JValidators} from '@core/utils/j-validators';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

@Component({
  selector: 'app-login-main',
  templateUrl: 'login-main.component.html',
  styles: []
})
export class LoginMainComponent implements OnInit {

  constructor(
    private readonly store$: Store<RootStoreState.State>,
    private readonly fb: FormBuilder
  ) {
  }

  form: FormGroup; // form

  username: FormControl; // attributo
  password: FormControl;

  hasError$: Observable<boolean>;
  err$: Observable<string>;

  ngOnInit(): void {
    this.makeFrom();
    this.hasError$ = this.store$.pipe(
      select(AuthStoreSelectors.selectHasError)
    );

    this.err$ = this.store$.pipe(
      select(AuthStoreSelectors.selectErr),
      tap(sssssssss => console.log('sssssssss', sssssssss)),
      map(value => !!value ? value.message : '')
    );
  }

  makeFrom(): void {
    this.username = this.fb.control('', JValidators.required());
    this.password = this.fb.control('', JValidators.required());

    this.form = this.fb.group({
      username: this.username, // attributo
      password: this.password // attributo
    });
  }

  submit(rawValue: any): void {
    const {username, password} = rawValue;
    this.store$.dispatch(AuthStoreActions.LoginRequest({username, password}));
  }
}
