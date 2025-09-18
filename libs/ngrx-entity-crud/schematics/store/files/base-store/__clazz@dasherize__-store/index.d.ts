import * as <%= clazz %>StoreActions from './<%= dasherize(clazz) %>.actions';
import * as <%= clazz %>StoreSelectors from './<%= dasherize(clazz) %>.selectors';
import * as <%= clazz %>StoreState from './<%= dasherize(clazz) %>.state';

export {
<%= clazz %>StoreModule
} from './<%= dasherize(clazz) %>-store.module';

export {
<%= clazz %>StoreActions,
  <%= clazz %>StoreSelectors,
  <%= clazz %>StoreState
};
