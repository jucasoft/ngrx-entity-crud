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
  }

}
