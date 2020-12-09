import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {<%= clazz %>EditComponent} from './<%= dasherize(clazz) %>-edit/<%= dasherize(clazz) %>-edit.component';
import {<%= clazz %>MainComponent} from './<%= dasherize(clazz) %>-main/<%= dasherize(clazz) %>-main.component';
import {<%= clazz %>ListComponent} from './<%= dasherize(clazz) %>-list/<%= dasherize(clazz) %>-list.component';
import {<%= clazz %>RoutingModule} from './<%= dasherize(clazz) %>-routing.module';
import {ButtonNew<%= clazz %>Component} from './components/button-new-<%= dasherize(clazz) %>.component';
import {TableModule} from 'primeng/table';
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {SearchModule} from '@components/search/search.module';
import {PipesModule} from '@core/pipe/pipes.module';

@NgModule({
  declarations: [
    <%= clazz %>EditComponent,
    <%= clazz %>MainComponent,
    <%= clazz %>ListComponent,
    ButtonNew<%= clazz %>Component
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    <%= clazz %>RoutingModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    PipesModule,
    SearchModule
  ],
  providers: [],
  entryComponents: []
})
export class <%= clazz %>Module {
}
