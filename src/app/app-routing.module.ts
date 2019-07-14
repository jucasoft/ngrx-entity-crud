import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {StoreRouterConnectingModule} from '@ngrx/router-store';

const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: ''},
  {path: 'coin', loadChildren: () => import('./main/pages/coin/coin.module').then(m => m.CoinModule)},
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes),
    StoreRouterConnectingModule,
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}

