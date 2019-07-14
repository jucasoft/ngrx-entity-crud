import {Pipe, PipeTransform} from '@angular/core';
import {AbstractControl} from '@angular/forms';

@Pipe({
  name: 'validatorClass', pure: false
})
export class ValidatorClassPipe implements PipeTransform {

  transform = (value: AbstractControl, args?: any): any => {
    const errors = value.errors && value.errors.error ? `ng-${value.errors.level} ` : '';
    const invalid = value.invalid ? 'ng-invalid ' : '';
    const touched = value.touched ? 'ng-touched ' : 'ng-untouched ';
    const valid = value.valid ? 'ng-valid ' : '';
    const dirty = value.dirty ? 'ng-dirty ' : '';
    const disabled = value.disabled ? 'ng-disabled ' : '';
    return `${errors}${invalid}${touched}${valid}${dirty}${disabled}`;
  };

}
