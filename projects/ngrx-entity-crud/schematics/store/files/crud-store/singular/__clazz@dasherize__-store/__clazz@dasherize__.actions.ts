import {Names} from './<%= dasherize(clazz) %>.names';
import {createCrudActionsFactory} from 'ngrx-entity-crud';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

export const actions = createCrudActionsFactory<<%= clazz %>>().createCrudActions(Names.NAME);

export const {
  Response,
  ResetResponses,

  SelectRequest,
  SelectFailure,
  SelectSuccess,

  SearchRequest,
  SearchFailure,
  SearchSuccess,

  CreateRequest,
  CreateFailure,
  CreateSuccess,

  EditRequest,
  EditFailure,
  EditSuccess,

  Reset,

  Edit,
  Create,
  Delete,
} = actions;



