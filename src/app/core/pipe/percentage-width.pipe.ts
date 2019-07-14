import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'percentagewidth'
})
export class PercentageWidthPipe implements PipeTransform {

  transform(percentage: number): any {
    const innerWidth = window.innerWidth;
    return (innerWidth * percentage) / 100;
  }

}
