import {InjectionToken, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActionReducer, StoreModule} from '@ngrx/store';
import {EffectsModule} from '@ngrx/effects';
import {<%= clazz %>StoreEffects} from './<%= dasherize(clazz) %>.effects';
import {featureReducer} from './<%= dasherize(clazz) %>.reducer';
import {State} from './<%= dasherize(clazz) %>.state';
import {Names} from './<%= dasherize(clazz) %>.names';
<% if (persist) { %>import {actions} from './<%= dasherize(clazz) %>.actions';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {createPersistenceEffects, createPersistenceReducer, createPersistenceSelectors, necPersistenceFeatureKey} from 'ngrx-entity-crud/persistence';
<% } %>
export const INJECTION_TOKEN = new InjectionToken<ActionReducer<State>>(`${Names.NAME}-store Reducers`);
<% if (persist) { %>
// Persistenza locale IndexedDB (opt-in, generata da --persist): vedi ngrx-entity-crud/persistence
// e ngrx-entity-crud-persistence-plan.md. Effects/reducer/selectors sono chiusi su Names.NAME.
// <nec-restore-search> (Fase 3 del piano) legge lo stato via [selectors], non risolve piu' la
// classe Effects con l'Injector.
export const <%= clazz %>PersistenceEffects = createPersistenceEffects<<%= clazz %>>({
	feature: Names.NAME,
	selectId: <%= clazz %>.selectId,
	actions,
});
export const <%= clazz %>PersistenceReducer = createPersistenceReducer(Names.NAME);
export const <%= clazz %>PersistenceSelectors = createPersistenceSelectors(Names.NAME);
<% } %>
@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
		<% if (persist) { %>StoreModule.forFeature(necPersistenceFeatureKey(Names.NAME), <%= clazz %>PersistenceReducer),
		<% } %>EffectsModule.forFeature([<%= clazz %>StoreEffects<% if (persist) { %>, <%= clazz %>PersistenceEffects<% } %>]),
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
