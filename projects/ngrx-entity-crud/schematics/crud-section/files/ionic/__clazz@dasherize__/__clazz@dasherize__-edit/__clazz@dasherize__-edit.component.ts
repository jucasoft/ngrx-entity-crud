import {Component} from '@angular/core';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {<%= clazz %>StoreActions} from '@root-store/<%= dasherize(clazz) %>-store';

import {FormGroup} from '@angular/forms';
import {EditBaseComponent} from '@components/edit-base/edit-base.component';
import * as RouterStoreActions from '@root-store/router-store/actions';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-edit',
  templateUrl: './<%= dasherize(clazz) %>-edit.component.html',
  styles: [``]
})
export class <%= clazz %>EditComponent extends EditBaseComponent<<%= clazz %>> {

  form: FormGroup;
  keys: string[];

  setItemPerform(value: <%= clazz %>): void {
    const group = this.fb.group({});
    this.keys = Object.keys(value);
    this.keys.forEach(key => group.addControl(key, this.fb.control({value: value[key], disabled: key === 'id'})));
    this.form = group;
  }

  onSavePerform(item: <%= clazz %>): void {
    this.store$.dispatch(<%= clazz %>StoreActions.EditRequest({
      item, onResult: [
        // azione che verrà invocata al result della chiamata all'interno dell'effect.
        RouterStoreActions.RouterBack()
      ]
    }));
  }

  onCopyPerform(item: <%= clazz %>): void {
    this.store$.dispatch(<%= clazz %>StoreActions.CreateRequest({
      item, onResult: [
        // azione che verrà invocata al result della chiamata all'interno dell'effect.
        RouterStoreActions.RouterBack()
      ]
    }));
  }

  onDeletePerform(item) {
    this.store$.dispatch(<%= clazz %>StoreActions.DeleteRequest({
      item, onResult: [
        // azione che verrà invocata al result della chiamata all'interno dell'effect.
        RouterStoreActions.RouterBack()
      ]
    }));
  }

  cancel(): void {
    this.store$.dispatch(RouterStoreActions.RouterBack());
  }

}
