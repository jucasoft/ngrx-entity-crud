import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {<%= clazz %>MainComponent} from './<%= dasherize(clazz) %>-main/<%= dasherize(clazz) %>-main.component';
import {<%= clazz %>RoutingModule} from './<%= dasherize(clazz) %>-routing.module';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {PipesModule} from '@core/pipe/pipes.module';

@NgModule({
  declarations: [
    <%= clazz %>MainComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    <%= clazz %>RoutingModule,
    InputTextModule,
    PipesModule

  ],
  providers: [],
  entryComponents: []
})
export class <%= clazz %>Module {
}
