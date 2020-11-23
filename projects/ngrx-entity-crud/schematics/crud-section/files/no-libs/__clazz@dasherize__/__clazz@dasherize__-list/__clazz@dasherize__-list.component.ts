import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {<%= clazz %>StoreActions, <%= clazz %>StoreSelectors, RootStoreState} from '@root-store/index';
import {Observable} from 'rxjs';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';


@Component({
  selector: 'app-<%= dasherize(clazz) %>-list',
  templateUrl: `<%= dasherize(clazz) %>-list.component.html`,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= clazz %>ListComponent implements OnInit {


  collection$: Observable<<%= clazz %>[]>;

  constructor(private store$: Store<RootStoreState.State>) {
    console.log('<%= clazz %>ListComponent.constructor()');
  }

  ngOnInit(): void {
    console.log('<%= clazz %>ListComponent.ngOnInit()');

    this.collection$ = this.store$.select(<%= clazz %>StoreSelectors.selectAll);

    this.store$.dispatch(
      <%= clazz %>StoreActions.SearchRequest({queryParams: {}})
    );

  }

  onEdit(item): void {
    console.log('<%= clazz %>ListComponent.onEdit()');

/*

    this.store$.dispatch(RouterStoreActions.RouterGoPopUp({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}]
    }));

*/

  }

  onCopy(value): void {
    console.log('<%= clazz %>ListComponent.onCopy()');
/*

    this.store$.dispatch(RouterStoreActions.RouterGoPopUp({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}]
    }));

*/

  }

  onDelete(item): void {
    // this.store$.dispatch(<%= clazz %>StoreActions.DeleteRequest({item}));
  }

}
