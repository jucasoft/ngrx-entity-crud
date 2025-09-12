import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {<%= clazz %>StoreActions, <%= clazz %>StoreSelectors, RootStoreState} from '@root-store/index';
import {Observable} from 'rxjs';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {RouterStoreActions} from '@root-store/router-store/index';
import {tap} from 'rxjs/operators';
import {ConfirmationService} from 'primeng/api';
import {PopUpData} from '@root-store/router-store/pop-up-base.component';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-list',
  templateUrl: `<%= dasherize(clazz) %>-list.component.html`,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= clazz %>ListComponent implements OnInit {


  collection$: Observable<<%= clazz %>[]>;
  cols: any;
  itemsSelected$: Observable<<%= clazz %>[]>;

  constructor(private store$: Store<RootStoreState.State>,
              private confirmationService: ConfirmationService) {
    console.log('<%= clazz %>ListComponent.constructor()');
  }

  ngOnInit(): void {
    console.log('<%= clazz %>ListComponent.ngOnInit()');

    this.itemsSelected$ = this.store$.pipe(
      select(<%= clazz %>StoreSelectors.selectItemsSelected)
    );

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

  onEdit(item): void {
    console.log('<%= clazz %>ListComponent.onEdit()');

    const data: PopUpData<<%= clazz %>> = {
      item,
      props: {title: 'Edit <%= clazz %>', route: '<%= dasherize(clazz) %>'}
    };

    // apro la popUP
    this.store$.dispatch(RouterStoreActions.RouterGoPopUp({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}],
      data
    }));

  }

  onCopy(value): void {
    console.log('<%= clazz %>ListComponent.onCopy()');

    const item = {...{}, ...value, ...{id: null}};
    const data: PopUpData<<%= clazz %>> = {
      item,
      props: {title: 'Copy <%= clazz %>', route: '<%= dasherize(clazz) %>'}
    };

    this.store$.dispatch(RouterStoreActions.RouterGoPopUp({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}],
      data
    }));

  }

  onDelete(mutationParams): void {

    this.confirmationService.confirm({
      message: 'Are you sure that you want to perform this action?',
      accept: () => {
        this.store$.dispatch(<%= clazz %>StoreActions.DeleteRequest({mutationParams}));
      }
    });

  }

  onSelectionChange(items: <%= clazz %>[]): void {
    console.log('<%= clazz %>ListComponent.onSelectionChange()');
    console.log('items', items);
    this.store$.dispatch(<%= clazz %>StoreActions.SelectItems({items}));
  }

}
