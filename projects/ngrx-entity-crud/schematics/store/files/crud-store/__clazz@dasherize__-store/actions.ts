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

  DeleteManyRequest,
  DeleteManyFailure,
  DeleteManySuccess,

  CreateRequest,
  CreateFailure,
  CreateSuccess,

  CreateManyRequest,
  CreateManyFailure,
  CreateManySuccess,

  SelectRequest,
  SelectFailure,
  SelectSuccess,

  EditRequest,
  EditFailure,
  EditSuccess,

  EditManyRequest,
  EditManyFailure,
  EditManySuccess,

  Reset,
  Filters,
  SelectItems,
  SelectItem,
  Edit,
  Create,
  Delete,
} = actions;



