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

  SelectRequest,
  SelectFailure,
  SelectSuccess,

  EditRequest,
  EditFailure,
  EditSuccess,

  Reset,
  Filters,
  SelectItems,
  SelectItem,
  Edit,
  Create,
  Delete,
} = actions;



