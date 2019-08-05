import {actions} from './actions';
import {adapter, initialState} from './state';

export const featureReducer = adapter.createCrudReducer(initialState, actions);