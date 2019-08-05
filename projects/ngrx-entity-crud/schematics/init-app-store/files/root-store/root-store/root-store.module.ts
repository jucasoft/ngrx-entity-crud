import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {metaReducers, reducers} from '@root-store/root-reducer';
import {RouterStoreModule} from "./router-store";

@NgModule({
    imports: [
        CommonModule,
        RouterStoreModule,
        StoreModule.forRoot(reducers, {metaReducers, runtimeChecks: {strictStateImmutability: true, strictActionImmutability: true}}),
        EffectsModule.forRoot([]),
    ],
    declarations: []
})
export class RootStoreModule {
}
