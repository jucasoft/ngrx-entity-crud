import {adapter} from './state';
import {Names} from './names';

export const actions = adapter.createCrudActions(Names.NAME);

export const {
  Response,
  ResetResponses,
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
  SelectRequest,
  SelectSuccess,
  SelectFailure,
  Reset,
  Filters,
  Create,
  Delete,
  Edit,
  SelectItem,
  SelectItems
} = actions;



