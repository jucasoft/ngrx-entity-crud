import {EntityCrudState, EntitySingleCrudState} from './models';

export function getInitialEntityCrudState<V>(): EntityCrudState<V> {
  return {
    ids: [],
    entities: {},
    isLoading: false,
    isLoaded: false,
    error: null,
    filters: {},
    lastCriteria: null,
    entitiesSelected: {},
    idsSelected: [],
    itemSelected: null,
    idSelected: null,
    responses: []
  };
}

export function getInitialSingleCrudState<V>(): EntitySingleCrudState<V> {
  return {
    item:null,
    itemSelected:null,
    isLoading: false,
    isLoaded: false,
    error: null,
    lastCriteria: null,
    responses: []
  };
}

export function createInitialCrudStateFactory<V>() {
  function getInitialCrudState(): EntityCrudState<V>;
  function getInitialCrudState<S extends object>(
    additionalState: S
  ): EntityCrudState<V> & S;
  function getInitialCrudState(additionalState: any = {}): any {
    return Object.assign(getInitialEntityCrudState(), additionalState);
  }

  return {getInitialCrudState};
}
