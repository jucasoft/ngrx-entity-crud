import {Component} from '@angular/core';
import {closePopUpAction, PopUpBaseComponent} from '@root-store/router-store/pop-up-base.component';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {FormGroup} from '@angular/forms';
import {<%= clazz %>StoreActions} from '@root-store/<%= dasherize(clazz) %>-store';


@Component({
  selector: 'app-<%= dasherize(clazz) %>-edit',
  templateUrl: './<%= dasherize(clazz) %>-edit.component.html',
  styles: [``]
})
export class <%= clazz %>EditComponent extends PopUpBaseComponent<<%= clazz %>> {

  form: FormGroup;
  keys: string[];

  override setItemPerform(value: <%= clazz %>): void {
    const group = this.fb.group({});
    this.keys = Object.keys(value);
    this.keys.forEach(key => group.addControl(key, this.fb.control({value: value[key], disabled: key === 'id'})));
    this.form = group;
  }

  override acceptPerform(mutationParams: <%= clazz %>): void {
    if (mutationParams.id) {
      this.store$.dispatch(<%= clazz %>StoreActions.EditRequest({
        mutationParams, onResult: [
          // azione che verrà invocata al result della chiamata all'interno dell'effect.
          // chiude la popUP.
          // closePopUpAction: metodo per la creazione dell'azione di chiusura della popUP
          closePopUpAction
        ]
      }));
    } else {
      this.store$.dispatch(<%= clazz %>StoreActions.CreateRequest({
        mutationParams, onResult: [
          // azione che verrà invocata al result della chiamata all'interno dell'effect.
          // chiude la popUP.
          // closePopUpAction: metodo per la creazione dell'azione di chiusura della popUP
          closePopUpAction
        ]
      }));
    }
  }

  // cancel(): void {
  //   this.store$.dispatch(closePopUpAction(this.route));
  // }
}
