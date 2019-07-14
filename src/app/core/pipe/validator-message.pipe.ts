import {Pipe, PipeTransform} from '@angular/core';
import {AbstractControl} from '@angular/forms';

@Pipe({
  name: 'validatorMessage', pure: false
})
export class ValidatorMessagePipe implements PipeTransform {

  transform(value: AbstractControl, args?: any): any {
    return value.errors && value.errors.error ? value.errors.getMessage() : '';
  }

}
