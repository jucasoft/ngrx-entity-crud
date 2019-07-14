import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {EffectsModule} from '@ngrx/effects';
import {RouterEffects} from './effects';
import {StoreModule} from '@ngrx/store';
import {routerReducer} from '@ngrx/router-store';
import {Names} from './names';


@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(Names.NAME, routerReducer),
    EffectsModule.forFeature([RouterEffects]),
  ],
  declarations: [],
  providers: [RouterEffects]

})
export class RouterStoreModule {
}
