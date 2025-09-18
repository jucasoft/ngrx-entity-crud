import {Pipe, PipeTransform} from '@angular/core';
import {FormGroup} from '@angular/forms';

@Pipe({
  name: 'jsonForm', pure: false
})
export class JsonFormPipe implements PipeTransform {

  transform(value: FormGroup, args?: any): any {
    const result = {
      errors: value.errors,
      controls: [],
      value: value.value,
      rawValue: value.getRawValue(),
      status: value.status,
      touched: value.touched,
      valid: value.valid,
    };
    for (const key  in value.controls) {
      const val = {};
      val[key] = value.controls[key].errors;
      if (!!val[key] && !!val[key].getMessage) {
        val[key]._messageRendered = val[key].getMessage();
      }
      result.controls.push(val);
    }
    return result;
  }

}
