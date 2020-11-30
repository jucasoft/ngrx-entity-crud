import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {<%= clazz %>MainComponent} from './<%= dasherize(clazz) %>-main/<%= dasherize(clazz) %>-main.component';
import {<%= clazz %>EditComponent} from './<%= dasherize(clazz) %>-edit/<%= dasherize(clazz) %>-edit.component';

const routes: Routes = [
  {
    path: 'main',
    component: <%= clazz %>MainComponent,
    pathMatch: 'full'
  },
  {
    path: 'edit',
    component: <%= clazz %>EditComponent,
    pathMatch: 'full'
  },
  {
    path: '',
    redirectTo: 'main',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'main',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class <%= clazz %>RoutingModule {
}
