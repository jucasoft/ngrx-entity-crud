import * as <%= clazz %>StoreActions from './<%= dasherize(clazz) %>.actions';
import * as <%= clazz %>StoreSelectors from './<%= dasherize(clazz) %>.selectors';
<% if(type === 'CRUD+GRAPHQL') {%>import * as <%= clazz %>Criteria from './<%= dasherize(clazz) %>.criteria';<% } %>
import * as <%= clazz %>StoreState from './<%= dasherize(clazz) %>.state';

export {
	<%= clazz %>StoreModule
} from './<%= dasherize(clazz) %>-store.module';

export {
	<%= clazz %>StoreActions,
	<%= clazz %>StoreSelectors,
<% if(type === 'CRUD+GRAPHQL') {%>	<%= clazz %>Criteria,<% } %>
	<%= clazz %>StoreState
};
