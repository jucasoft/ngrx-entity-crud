import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {LoginMainComponent} from './login-main/login-main.component';

const routes: Routes = [
  {
    path: 'main',
    component: LoginMainComponent,
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
export class LoginRoutingModule {
}
