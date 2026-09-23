import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {<%= clazz %>StoreEffects} from './<%= dasherize(clazz) %>.effects';
import {featureReducer} from './<%= dasherize(clazz) %>.reducer';
import {State} from './<%= dasherize(clazz) %>.state';
import {Names} from './<%= dasherize(clazz) %>.names';
import {<%= clazz %>Persistence} from './<%= dasherize(clazz) %>.persistence';

export const INJECTION_TOKEN = new InjectionToken<ActionReducer<State>>(`${Names.NAME}-store Reducers`);

@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
		// persistenza locale (vedi <%= dasherize(clazz) %>.persistence.ts): sempre registrata, attiva solo con enabled: true
		StoreModule.forFeature(<%= clazz %>Persistence.featureKey, <%= clazz %>Persistence.reducer),
		EffectsModule.forFeature([<%= clazz %>StoreEffects, <%= clazz %>Persistence.effects]),
	],
	declarations: [],
	providers: [<%= clazz %>StoreEffects,
		{
			provide: INJECTION_TOKEN,
			useFactory: (): ActionReducer<State> => featureReducer
		}]
})
export class <%= clazz %>StoreModule {
}
