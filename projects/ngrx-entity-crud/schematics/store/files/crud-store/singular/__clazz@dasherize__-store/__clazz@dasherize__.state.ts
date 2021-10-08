import {EntitySingleCrudState, getInitialSingleCrudState} from 'ngrx-entity-crud';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';


export interface State extends EntitySingleCrudState<<%= clazz %>> {
}

export const initialState: State = getInitialSingleCrudState<<%= clazz %>>();
