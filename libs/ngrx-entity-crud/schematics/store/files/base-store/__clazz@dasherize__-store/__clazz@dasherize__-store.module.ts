import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {<%= clazz %>StoreEffects} from './<%= dasherize(clazz) %>.effects';
import {featureReducer} from './<%= dasherize(clazz) %>.reducer';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {Names} from './<%= dasherize(clazz) %>.names';

export const INJECTION_TOKEN = new InjectionToken<ActionReducer<<%= clazz %>>>(`${Names.NAME}-store Reducers`);

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
		EffectsModule.forFeature([<%= clazz %>StoreEffects]),
	],
	declarations: [],
	providers: [<%= clazz %>StoreEffects,
		{
			provide: INJECTION_TOKEN,
			useFactory: (): ActionReducer<<%= clazz %>> => featureReducer
		}]
})
export class <%= clazz %>StoreModule {
}
