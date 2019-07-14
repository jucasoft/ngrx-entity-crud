import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'differencewidth'
})
export class DifferenceWidthPipe implements PipeTransform {

  transform(value: number): any {
    const innerWidth = window.innerWidth;
    return innerWidth - value;
  }

}
