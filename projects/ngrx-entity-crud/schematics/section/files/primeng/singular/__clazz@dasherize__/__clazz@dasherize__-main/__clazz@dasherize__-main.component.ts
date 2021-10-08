import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {<%= clazz %>StoreActions, <%= clazz %>StoreSelectors} from '@root-store/index';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {FormBuilder, FormGroup} from '@angular/forms';
import {State} from '@root-store/state';
import {ConfirmationService} from 'primeng/api';
import {filter, first} from 'rxjs/operators';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-main',
  templateUrl: '<%= dasherize(clazz) %>-main.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= clazz %>MainComponent implements OnInit {

  form: FormGroup;
  keys: string[];

  constructor(protected store$: Store<State>,
              protected ref: ChangeDetectorRef,
              protected confirmationService: ConfirmationService,
              protected fb: FormBuilder) {
    ref.detach()
  }

  setItem(value: <%= clazz %>): void {
    debugger
    console.log('<%= clazz %>MainComponent.setItem()');
    console.log('value', value);
    const group = this.fb.group({});
    this.keys = Object.keys(value);
    this.keys.forEach(key => group.addControl(key, this.fb.control({value: value[key], disabled: key === 'id'})));
    this.form = group;
    this.ref.reattach();
    this.ref.markForCheck();
  }

  ngOnInit(): void {
    this.store$.pipe(
      select(<%= clazz %>StoreSelectors.selectItem),
      filter(value => !!value),
      first()
    ).subscribe(value => this.setItem(value))
    this.store$.dispatch(<%= clazz %>StoreActions.SelectRequest({queryParams: {}}))
  }

  submit(mutationParams: any) {
    this.store$.dispatch(<%= clazz %>StoreActions.EditRequest({mutationParams}))
  }
}
