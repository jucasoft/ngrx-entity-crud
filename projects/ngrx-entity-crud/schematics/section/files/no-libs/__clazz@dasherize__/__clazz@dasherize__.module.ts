import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {<%= clazz %>EditComponent} from './<%= dasherize(clazz) %>-edit/<%= dasherize(clazz) %>-edit.component';
import {<%= clazz %>MainComponent} from './<%= dasherize(clazz) %>-main/<%= dasherize(clazz) %>-main.component';
import {<%= clazz %>ListComponent} from './<%= dasherize(clazz) %>-list/<%= dasherize(clazz) %>-list.component';
import {<%= clazz %>RoutingModule} from './<%= dasherize(clazz) %>-routing.module';

@NgModule({
  declarations: [
    <%= clazz %>EditComponent,
    <%= clazz %>MainComponent,
    <%= clazz %>ListComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    <%= clazz %>RoutingModule
  ],
  providers: [],

})
export class <%= clazz %>Module {
}
