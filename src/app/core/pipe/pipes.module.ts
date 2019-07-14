import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {JsonFormPipe} from './json-form.pipe';
import {PercentageWidthPipe} from './percentage-width.pipe';
import {SplitPipe} from './split.pipe';
import {ValidatorClassPipe} from './validator-class.pipe';
import {ValidatorMessagePipe} from './validator-message.pipe';
import {WarnsIsValidPipe} from './warns-is-valid.pipe';
import {DifferenceWidthPipe} from './difference-width.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    JsonFormPipe,
    PercentageWidthPipe,
    SplitPipe,
    ValidatorClassPipe,
    ValidatorMessagePipe,
    WarnsIsValidPipe,
    DifferenceWidthPipe
  ],
  exports: [
    JsonFormPipe,
    PercentageWidthPipe,
    SplitPipe,
    ValidatorClassPipe,
    ValidatorMessagePipe,
    WarnsIsValidPipe,
    CommonModule,
    DifferenceWidthPipe
  ]
})
export class PipesModule {
  static forRoot() {
    return {
      ngModule: PipesModule,
      providers: [],
    };
  }
}
