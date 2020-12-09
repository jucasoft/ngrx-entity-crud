import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {RootStoreState} from '@root-store/index';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-main',
  templateUrl: '<%= dasherize(clazz) %>-main.component.html',
  styles: []
})
export class <%= clazz %>MainComponent implements OnInit {

  constructor(private readonly store$: Store<RootStoreState.State>) {
  }

  ngOnInit(): void {
  }

}
