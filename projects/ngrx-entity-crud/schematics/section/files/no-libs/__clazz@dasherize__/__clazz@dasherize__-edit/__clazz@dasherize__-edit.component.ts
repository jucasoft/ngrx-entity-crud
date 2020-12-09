import {Component} from '@angular/core';
import {RootStoreState} from '@root-store/index';
import {Store} from '@ngrx/store';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-edit',
  templateUrl: './<%= dasherize(clazz) %>-edit.component.html',
  styles: [``]
})
export class <%= clazz %>EditComponent {

  constructor(private store$: Store<RootStoreState.State>) {
    console.log('<%= clazz %>EditComponent.constructor()');
  }

}
