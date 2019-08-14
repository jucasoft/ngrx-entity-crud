import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {<%= clazz %>StoreActions, RootStoreState} from '@root-store/index';
import {Actions} from 'ngrx-entity-crud';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-main',
  templateUrl: '<%= dasherize(clazz) %>-main.component.html',
  styles: []
})
export class <%= clazz %>MainComponent implements OnInit {

  constructor(private readonly store$: Store<RootStoreState.State>) {
  }

  actions: Actions<<%= clazz %>> = <%= clazz %>StoreActions.actions;

  ngOnInit() {
    // this.ruleTables$ = this.store$.pipe(
    //   select(RuleTableStoreSelectors.selectFilteredItems),
    //   tap(values => this.updateRowGroupMetaData(values))
    // );
  }
}
