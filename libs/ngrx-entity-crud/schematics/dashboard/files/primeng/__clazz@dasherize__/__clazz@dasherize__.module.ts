import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CardModule} from 'primeng/card';
import {NecDashboardComponent} from 'ngrx-entity-crud/devtools';
import {<%= clazz %>MainComponent} from './<%= dasherize(clazz) %>-main/<%= dasherize(clazz) %>-main.component';
import {<%= clazz %>RoutingModule} from './<%= dasherize(clazz) %>-routing.module';

@NgModule({
  declarations: [
    <%= clazz %>MainComponent,
  ],
  imports: [
    CommonModule,
    CardModule,
    <%= clazz %>RoutingModule,
    // Component standalone esportato dalla libreria: incapsula tutta la logica diagnostica.
    NecDashboardComponent,
  ],
})
export class <%= clazz %>Module {
}
