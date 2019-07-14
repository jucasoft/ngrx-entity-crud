import {Pipe, PipeTransform} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Pipe({
  name: 'warnsIsValid', pure: false
})
export class WarnsIsValidPipe implements PipeTransform {

  transform(form: FormGroup, args?: any): boolean {
    if (form.valid) {
      return true;
    }

    // questa pipe serve ad evitare che venga disabilitato il tasto salva se esistono solo errori di tipo "warn"
    for (const key  in form.controls) {
      if (form.controls[key].errors && form.controls[key].errors.level === 'error') {
        return form.valid;
      }
    }

    return true;
  }

}
