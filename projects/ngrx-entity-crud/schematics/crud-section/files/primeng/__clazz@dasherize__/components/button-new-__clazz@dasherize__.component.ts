import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {RouterStoreActions} from '@root-store/router-store/index';
import {PopUpData} from '@root-store/router-store/pop-up-base.component';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {RootStoreState} from '@root-store/index';

@Component({
  selector: 'app-button-new-<%= dasherize(clazz) %>',
  template: `
    <button type="button" pButton icon="fa fa-fw fa-plus"
            label="New <%= clazz %>" (click)="onCreate()"
            [disabled]="(disabled$ |async)"
            class="p-button-success"></button>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonNew<%= clazz %>Component implements OnInit {

  disabled$: Observable<boolean>;

  constructor(private readonly store$: Store<RootStoreState.State>) {
  }

  ngOnInit() {
    this.disabled$ = of(false);
  }

  onCreate() {
    const item: <%= clazz %> = new <%= clazz %>();

    const data: PopUpData<<%= clazz %>> = {
      item,
      props: {title: 'New <%= clazz %>', route: '<%= dasherize(clazz) %>'}
    };

    this.store$.dispatch(RouterStoreActions.RouterGoPopUp({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}],
      data
    }));
  }

}
