import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {CoinRoutingModule} from './coin-routing.module';
import {CoinListComponent} from './coin-list/coin-list.component';
import {CoinService} from '@services/coin.service';
import {TableModule} from 'primeng/table';
import {CoinEditComponent} from './coin-edit/coin-edit.component';
import {ReactiveFormsModule} from '@angular/forms';
import {PipesModule} from '../../../core/pipe/pipes.module';
import {PrimeNgSharedModule} from '../../shared/prime-ng-shared.module';
import {ButtonModule} from 'primeng/button';
import {CoinStoreModule} from '../../../root-store/coin-store';

@NgModule({
  declarations: [
    CoinListComponent,
    CoinEditComponent,
  ],
  imports: [
    CommonModule,
    CoinRoutingModule,
    TableModule,
    ReactiveFormsModule,
    PipesModule,
    PrimeNgSharedModule,
    ButtonModule,
  ],
  providers: [CoinService]
})
export class CoinModule {
}
