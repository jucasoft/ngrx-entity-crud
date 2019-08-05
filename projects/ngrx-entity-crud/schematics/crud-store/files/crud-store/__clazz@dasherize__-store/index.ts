import * as <%= clazz %>StoreActions from './actions';
import * as <%= clazz %>StoreSelectors from './selectors';
import * as <%= clazz %>StoreState from './state';

export {
	<%= clazz %>StoreModule
} from './<%= dasherize(clazz) %>-store.module';

export {
	<%= clazz %>StoreActions,
	<%= clazz %>StoreSelectors,
	<%= clazz %>StoreState
};
