import {ActionEnum, Actions, CrudEnum, FilterMetadata, ICriteria, OptManyRequest, OptRequest, OptResponse} from './models';
import {createAction, props} from '@ngrx/store';

export function createCrudActionsFactory<T>() {
  function createCrudActions(name: string): Actions<T> {

    // tslint:disable:variable-name
    /**
     * mode:
     *  comportamento predefinito, il dato attualmente presente viene cancellato e ripopolato al result della chiamata
     *  REFRESH => il dato viene sostituito al result della chiamata.
     */
    const Response = createAction(`[${name}] ${ActionEnum.RESPONSE}`, props<OptResponse<T | T[]>>());
    const ResetResponses = createAction(`[${name}] ${CrudEnum.RESET} ${ActionEnum.RESPONSE}`);

    const SearchRequest = createAction(`[${name}] ${CrudEnum.SEARCH} ${ActionEnum.REQUEST}`, props<ICriteria>());
    const SearchFailure = createAction(`[${name}] ${CrudEnum.SEARCH} ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const SearchSuccess = createAction(`[${name}] ${CrudEnum.SEARCH} ${ActionEnum.SUCCESS}`, props<{ items: T[], request: ICriteria }>());

    const DeleteRequest = createAction(`[${name}] ${CrudEnum.DELETE} ${ActionEnum.REQUEST}`, props<OptRequest<T>>());
    const DeleteFailure = createAction(`[${name}] ${CrudEnum.DELETE} ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const DeleteSuccess = createAction(`[${name}] ${CrudEnum.DELETE} ${ActionEnum.SUCCESS}`, props<{ id: string }>());

    const DeleteManyRequest = createAction(`[${name}] ${CrudEnum.DELETE} many ${ActionEnum.REQUEST}`, props<OptManyRequest<T>>());
    const DeleteManyFailure = createAction(`[${name}] ${CrudEnum.DELETE} many ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const DeleteManySuccess = createAction(`[${name}] ${CrudEnum.DELETE} many ${ActionEnum.SUCCESS}`, props<{ ids: string[] }>());

    const CreateRequest = createAction(`[${name}] ${CrudEnum.CREATE} ${ActionEnum.REQUEST}`, props<OptRequest<T>>());
    const CreateFailure = createAction(`[${name}] ${CrudEnum.CREATE} ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const CreateSuccess = createAction(`[${name}] ${CrudEnum.CREATE} ${ActionEnum.SUCCESS}`, props<{ item: T }>());

    const CreateManyRequest = createAction(`[${name}] ${CrudEnum.CREATE} many ${ActionEnum.REQUEST}`, props<OptManyRequest<T>>());
    const CreateManyFailure = createAction(`[${name}] ${CrudEnum.CREATE} many ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const CreateManySuccess = createAction(`[${name}] ${CrudEnum.CREATE} many ${ActionEnum.SUCCESS}`, props<{ items: T[] }>());

    const SelectRequest = createAction(`[${name}] ${CrudEnum.SELECT} ${ActionEnum.REQUEST}`, props<OptRequest<T>>());
    const SelectFailure = createAction(`[${name}] ${CrudEnum.SELECT} ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const SelectSuccess = createAction(`[${name}] ${CrudEnum.SELECT} ${ActionEnum.SUCCESS}`, props<{ item: T }>());

    const EditRequest = createAction(`[${name}] ${CrudEnum.EDIT} ${ActionEnum.REQUEST}`, props<OptRequest<T>>());
    const EditFailure = createAction(`[${name}] ${CrudEnum.EDIT} ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const EditSuccess = createAction(`[${name}] ${CrudEnum.EDIT} ${ActionEnum.SUCCESS}`, props<{ item: T }>());

    const EditManyRequest = createAction(`[${name}] ${CrudEnum.EDIT} many ${ActionEnum.REQUEST}`, props<OptManyRequest<T>>());
    const EditManyFailure = createAction(`[${name}] ${CrudEnum.EDIT} many ${ActionEnum.FAILURE}`, props<{ error: string }>());
    const EditManySuccess = createAction(`[${name}] ${CrudEnum.EDIT} many ${ActionEnum.SUCCESS}`, props<{ items: T[] }>());

    const Reset = createAction(`[${name}] ${CrudEnum.RESET}`);
    const Filters = createAction(`[${name}] Filters`, props<{ filters: { [s: string]: FilterMetadata; } }>());

    const SelectItems = createAction(`[${name}] SelectItems`, props<{ items: T[] }>());
    const AddManySelected = createAction(`[${name}] AddManySelected`, props<{ items: T[] }>());
    const RemoveManySelected = createAction(`[${name}] RemoveManySelected`, props<{ ids: string[] }>());
    const RemoveAllSelected = createAction(`[${name}] RemoveAllSelected`);

    const SelectItem = createAction(`[${name}] SelectItem`, props<{ item: T }>());

    const Edit = createAction(`[${name}] ${CrudEnum.EDIT} `, props<{ item: T }>());
    const Create = createAction(`[${name}] ${CrudEnum.CREATE}`, props<{ item: T }>());
    const Delete = createAction(`[${name}] ${CrudEnum.DELETE} `, props<{ id: string }>());

    return {
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
      RemoveManySelected,
      AddManySelected,
      RemoveAllSelected,
      SelectItem,
      Edit,
      Create,
      Delete,
    };
  }

  return {createCrudActions};
}
