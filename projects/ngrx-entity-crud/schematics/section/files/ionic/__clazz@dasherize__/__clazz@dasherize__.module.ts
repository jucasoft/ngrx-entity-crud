import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {<%= clazz %>EditComponent} from './<%= dasherize(clazz) %>-edit/<%= dasherize(clazz) %>-edit.component';
import {<%= clazz %>MainComponent} from './<%= dasherize(clazz) %>-main/<%= dasherize(clazz) %>-main.component';
import {<%= clazz %>ListComponent} from './<%= dasherize(clazz) %>-list/<%= dasherize(clazz) %>-list.component';
import {<%= clazz %>RoutingModule} from './<%= dasherize(clazz) %>-routing.module';
import {SearchModule} from '@components/search/search.module';
import {IonicModule} from '@ionic/angular';
import {EditBaseModule} from '@components/edit-base/edit-base.module';
import {PipesModule} from '@core/pipe/pipes.module';

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
    <%= clazz %>RoutingModule,
    PipesModule,
    SearchModule,
    IonicModule,
    EditBaseModule
  ],
  providers: [],

})
export class <%= clazz %>Module {
}
