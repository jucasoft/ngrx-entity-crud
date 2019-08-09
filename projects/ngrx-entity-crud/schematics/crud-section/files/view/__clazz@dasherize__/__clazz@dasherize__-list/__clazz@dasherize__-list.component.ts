import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {<%= clazz %>StoreActions, <%= clazz %>StoreSelectors, RootStoreState} from '@root-store/index';
import {Observable} from 'rxjs';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {RouterStoreActions} from '@root-store/router-store/index';
import {tap} from 'rxjs/operators';
import {ConfirmationService} from 'primeng/api';
import {PopUpData} from '@root-store/router-store/pop-up-base.component';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-table',
  templateUrl: `<%= dasherize(clazz) %>-list.component.html`,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= clazz %>ListComponent implements OnInit {


  collection$: Observable<<%= clazz %>[]>;
  cols: any;

  constructor(private store$: Store<RootStoreState.State>,
              private confirmationService: ConfirmationService) {
    console.log('<%= clazz %>ListComponent.constructor()');
  }

  ngOnInit() {
    console.log('<%= clazz %>ListComponent.ngOnInit()');

    this.collection$ = this.store$.select(
      <%= clazz %>StoreSelectors.selectAll
    ).pipe(
      tap(values => {
        if (values && values.length > 0) {
          this.cols = Object.keys(values[0]);
        }
      })
    );

    this.store$.dispatch(
      <%= clazz %>StoreActions.SearchRequest({queryParams: {}})
    );

  }

  onEdit(item) {
    console.log('<%= clazz %>ListComponent.onEdit()');

    const state: PopUpData<<%= clazz %>> = {
      item,
      props: {title: 'Edit <%= clazz %>', route: '<%= dasherize(clazz) %>'}
    };

    // apro la popUP
    this.store$.dispatch(RouterStoreActions.RouterGo({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}],
      extras: {state}
    }));

  }

  onCopy(value) {
    console.log('<%= clazz %>ListComponent.onCopy()');

    const item = {...{}, ...value, ...{id: null}};
    const state: PopUpData<<%= clazz %>> = {
      item,
      props: {title: 'Copy <%= clazz %>', route: '<%= dasherize(clazz) %>'}
    };

    this.store$.dispatch(RouterStoreActions.RouterGo({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}],
      extras: {state}
    }));

  }

  onDelete(item) {

    this.confirmationService.confirm({
      message: 'Are you sure that you want to perform this action?',
      accept: () => {
        this.store$.dispatch(<%= clazz %>StoreActions.DeleteRequest({item}));
      }
    });

  }

}
