import {Component, Input, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {RootStoreState} from '@root-store/index';
import {parseQueryString} from '@core/utils/j-utils';
import {Actions} from 'ngrx-entity-crud';

@Component({
  selector: 'app-search',
  template: `
    <input #search type="text" (keyup.enter)="onSearch(search.value)"/>
  `,
  styles: []
})
export class SearchComponent implements OnInit {

  @Input()
  actions: Actions<any>;

  constructor(protected store$: Store<RootStoreState.State>) {
  }

  ngOnInit() {
  }

  onSearch(value: string) {
    this.store$.dispatch(this.actions.SearchRequest({queryParams: parseQueryString(value)}));
  }
}


