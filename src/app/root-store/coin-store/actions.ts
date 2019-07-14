import {adapter} from './state';
import {Names} from './names';

export const actions = adapter.createCrudActions(Names.NAME);

export const {
  SearchRequest,
  SearchFailure,
  SearchSuccess,
  DeleteRequest,
  DeleteFailure,
  DeleteSuccess,
  CreateRequest,
  CreateFailure,
  CreateSuccess,
  EditRequest,
  EditFailure,
  EditSuccess,
  Reset,
  SelectItem,
  SelectItems,
  Filters,
  Create,
  Delete,
  Edit,
} = actions;
