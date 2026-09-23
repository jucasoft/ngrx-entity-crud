import {createPersistence} from 'ngrx-entity-crud/persistence';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {actions} from './<%= dasherize(clazz) %>.actions';
import {Names} from './<%= dasherize(clazz) %>.names';

/**
 * Persistenza locale IndexedDB della sezione (ngrx-entity-crud/persistence): azioni, reducer,
 * selectors ed effects creati una sola volta sulla stessa feature dello store.
 *
 * Registrata in <%= dasherize(clazz) %>-store.module.ts. Con `enabled: false` il cablaggio c'e' ma e' spento:
 * nessun accesso a IndexedDB e <nec-restore-search> mostra solo il pulsante che avvolge.
 * Per attivarla basta `enabled: true`.
 */
export const <%= clazz %>Persistence = createPersistence<<%= clazz %>>({
  feature: Names.NAME,
  selectId: <%= clazz %>.selectId,
  actions,
  enabled: <%= persist ? 'true' : 'false' %>,
});
