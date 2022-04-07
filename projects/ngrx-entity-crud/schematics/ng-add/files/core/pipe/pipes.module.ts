import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {JsonFormPipe} from './json-form.pipe';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    JsonFormPipe,
  ],
  exports: [
    CommonModule,
    JsonFormPipe,
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
