import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MultiSelectModule} from 'primeng/multiselect';
import {InputTextModule} from 'primeng/inputtext';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    InputTextModule,
    MultiSelectModule
  ],
  exports: [InputTextModule]
})
export class PrimeNgSharedModule {
}
