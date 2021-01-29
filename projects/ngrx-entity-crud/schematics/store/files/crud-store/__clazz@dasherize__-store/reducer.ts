import {actions} from './actions';
import {adapter, initialState} from './state';

export const featureReducer = adapter.createCrudReducer(initialState, actions);

/*
// example code
const predicate = (criteria: ICriteria) => (value) => {
  const {queryParams} = criteria;
  // return value.companyId === queryParams.companyId;
  return true;
};

// example code
const customSearchSuccessOn = on(actions.SearchSuccess, (state: State, {type, items, request}) => {
  const newState = adapter.removeMany(
    predicate(request),
    {
      ...state,
      isLoaded: true,
      isLoading: false,
      error: null
    }
  );

  return adapter.addMany(
    items, newState
  );
});

// example code
const {
  responseOn,
  resetResponsesOn,
  searchRequestOn,
  deleteRequestOn,
  deleteManyRequestOn,
  editRequestOn,
  editManyRequestOn,
  createRequestOn,
  createManyRequestOn,
  selectRequestOn,
  searchSuccessOn,
  deleteSuccessOn,
  deleteManySuccessOn,
  createSuccessOn,
  createManySuccessOn,
  selectSuccessOn,
  editSuccessOn,
  editManySuccessOn,
  searchFailureOn,
  deleteFailureOn,
  deleteManyFailureOn,
  createFailureOn,
  createManyFailureOn,
  selectFailureOn,
  editFailureOn,
  editManyFailureOn,
  resetOn,
  filtersOn,
  selectItemsOn,
  selectItemOn,
  editOn,
  createOn,
  deleteOn
} = createCrudOns(adapter, initialState, actions);

export const featureReducer = createReducer<State>(initialState,
  responseOn,
  resetResponsesOn,
  searchRequestOn,
  deleteRequestOn,
  deleteManyRequestOn,
  editRequestOn,
  editManyRequestOn,
  createRequestOn,
  createManyRequestOn,
  selectRequestOn,
  searchSuccessOn,
  deleteSuccessOn,
  deleteManySuccessOn,
  createSuccessOn,
  createManySuccessOn,
  selectSuccessOn,
  editSuccessOn,
  editManySuccessOn,
  searchFailureOn,
  deleteFailureOn,
  deleteManyFailureOn,
  createFailureOn,
  createManyFailureOn,
  selectFailureOn,
  editFailureOn,
  editManyFailureOn,
  resetOn,
  filtersOn,
  selectItemsOn,
  selectItemOn,
  editOn,
  createOn,
  deleteOn
);
*/
