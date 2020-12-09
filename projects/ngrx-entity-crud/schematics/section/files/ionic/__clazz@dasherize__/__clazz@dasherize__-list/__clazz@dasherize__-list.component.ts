import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {<%= clazz %>StoreActions, <%= clazz %>StoreSelectors, RootStoreState} from '@root-store/index';
import {Observable} from 'rxjs';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {RouterStoreActions} from '@root-store/router-store/index';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-list',
  templateUrl: `<%= dasherize(clazz) %>-list.component.html`,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= clazz %>ListComponent implements OnInit {


  collection$: Observable<<%= clazz %>[]>;
  cols: any;

  constructor(private store$: Store<RootStoreState.State>) {
    console.log('<%= clazz %>ListComponent.constructor()');
  }


  ngOnInit() {
    console.log('<%= clazz %>ListComponent.ngOnInit()');

    this.collection$ = this.store$.select(
      <%= clazz %>StoreSelectors.selectAll
    );

  }

  onSelect(item) {
    console.log('<%= clazz %>ListComponent.onEdit()');

    const state = {
      item,
      props: {}
    };

    // apro la popUP
    this.store$.dispatch(RouterStoreActions.RouterGo({
      path: ['<%= dasherize(clazz) %>', 'edit'],
      extras: {state}
    }));

  }

}
