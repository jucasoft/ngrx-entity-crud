import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {<%= clazz %>Persistence, <%= clazz %>StoreActions, RootStoreState} from '@root-store/index';
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

  /**
   * persistenza locale della sezione (root-store/<%= dasherize(clazz) %>-store/<%= dasherize(clazz) %>.persistence.ts).
   * Se lo store e' stato generato prima di questa versione, <%= clazz %>Persistence non esiste:
   * `ng g ngrx-entity-crud:persistence --clazz=<%= clazz %>` lo aggiunge.
   */
  persistence = <%= clazz %>Persistence;

  ngOnInit(): void {
  }
}
