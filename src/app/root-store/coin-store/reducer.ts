import {actions} from './actions';
import {adapter, initialState} from './state';

export const reducer = adapter.createCrudReducer(initialState, actions);
