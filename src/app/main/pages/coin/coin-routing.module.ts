import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {CoinListComponent} from './coin-list/coin-list.component';
import {CoinEditComponent} from './coin-edit/coin-edit.component';

const routes: Routes = [
  {
    path: '',
    component: CoinListComponent
  },
  {
    path: 'edit',
    component: CoinEditComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CoinRoutingModule {
}
