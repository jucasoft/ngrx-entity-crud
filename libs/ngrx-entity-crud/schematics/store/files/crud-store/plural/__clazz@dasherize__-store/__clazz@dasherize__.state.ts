import {createCrudEntityAdapter, EntityCrudAdapter, EntityCrudState} from 'ngrx-entity-crud';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

export const adapter: EntityCrudAdapter<<%= clazz %>> = createCrudEntityAdapter<<%= clazz %>>({
	selectId: model => <%= clazz %>.selectId(model),
});

export interface State extends EntityCrudState<<%= clazz %>> {
};

export const initialState: State = adapter.getInitialCrudState();
