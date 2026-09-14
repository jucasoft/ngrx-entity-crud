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
import {createPersistenceEffects} from 'ngrx-entity-crud/persistence';
<% } %>
export const INJECTION_TOKEN = new InjectionToken<ActionReducer<State>>(`${Names.NAME}-store Reducers`);
<% if (persist) { %>
// Persistenza locale IndexedDB (opt-in, generata da --persist): vedi ngrx-entity-crud/persistence
// e ngrx-entity-crud-persistence-plan.md. Esportata perche' <nec-restore-search> (Fase 3 del
// piano) la risolve via Injector passandola come [effects] - non e' solo un dettaglio interno.
export const <%= clazz %>PersistenceEffects = createPersistenceEffects<<%= clazz %>>({
	feature: Names.NAME,
	selectId: <%= clazz %>.selectId,
	actions,
});
<% } %>
@NgModule({
	imports: [
		CommonModule,
		StoreModule.forFeature(Names.NAME, INJECTION_TOKEN),
		EffectsModule.forFeature([<%= clazz %>StoreEffects<% if (persist) { %>, <%= clazz %>PersistenceEffects<% } %>]),
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
