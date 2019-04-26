import {ActionEnum, Actions, CrudEnum, FilterMetadata, ICriteria} from './models';
import {action, payload} from 'ts-action';


export function createCrudActionsFactory<T>() {
  function createCrudActions(name: string);
  // mi è capitato di dover creare un'antità passandone una di tipo differente.
  function createCrudActions<R>(name: string): Actions<T>;
  function createCrudActions<R>(name: string): Actions<T> {

    /**
     * mode:
     *  comportamento predefinito, il dato attualmente presente viene cancellato e ripopolato al result della chiamata
     *  REFRESH => il dato viene sostituito al result della chiamata.
     */
    const SearchRequest = action(`[${name}] ${CrudEnum.SEARCH} ${ActionEnum.REQUEST}`,
      payload<{ criteria: ICriteria, mode?: 'REFRESH' }>());
    const SearchFailure = action(`[${name}] ${CrudEnum.SEARCH} ${ActionEnum.FAILURE}`, payload<{ error: string }>());
    const SearchSuccess = action(`[${name}] ${CrudEnum.SEARCH} ${ActionEnum.SUCCESS}`, payload<{ items: T[] }>());

    const DeleteRequest = action(`[${name}] ${CrudEnum.DELETE} ${ActionEnum.REQUEST}`, payload<{ item: T }>());
    const DeleteFailure = action(`[${name}] ${CrudEnum.DELETE} ${ActionEnum.FAILURE}`, payload<{ error: string }>());
    const DeleteSuccess = action(`[${name}] ${CrudEnum.DELETE} ${ActionEnum.SUCCESS}`, payload<{ id: string }>());

    const CreateRequest = action(`[${name}] ${CrudEnum.CREATE} ${ActionEnum.REQUEST}`, payload<{ item: T }>());
    const CreateFailure = action(`[${name}] ${CrudEnum.CREATE} ${ActionEnum.FAILURE}`, payload<{ error: string }>());
    const CreateSuccess = action(`[${name}] ${CrudEnum.CREATE} ${ActionEnum.SUCCESS}`, payload<{ item: T }>());

    const SelectRequest = action(`[${name}] ${CrudEnum.SELECT} ${ActionEnum.REQUEST}`, payload<{ item: T }>());
    const SelectFailure = action(`[${name}] ${CrudEnum.SELECT} ${ActionEnum.FAILURE}`, payload<{ error: string }>());
    const SelectSuccess = action(`[${name}] ${CrudEnum.SELECT} ${ActionEnum.SUCCESS}`, payload<{ item: T }>());

    const EditRequest = action(`[${name}] ${CrudEnum.EDIT} ${ActionEnum.REQUEST}`, payload<{ item: T }>());
    const EditFailure = action(`[${name}] ${CrudEnum.EDIT} ${ActionEnum.FAILURE}`, payload<{ error: string }>());
    const EditSuccess = action(`[${name}] ${CrudEnum.EDIT} ${ActionEnum.SUCCESS}`, payload<{ item: T }>());

    const Reset = action(`[${name}] Reset`);
    const Filters = action(`[${name}] Filters`, payload<{ filters: { [s: string]: FilterMetadata; } }>());
    const SelectItems = action(`[${name}] SelectItems`, payload<{ items: T[] }>());
    const SelectItem = action(`[${name}] SelectItem`, payload<{ item: T }>());

    const Edit = action(`[${name}] ${CrudEnum.EDIT} `, payload<{ item: T }>());
    const Create = action(`[${name}] ${CrudEnum.CREATE}`, payload<{ item: T }>());
    const Delete = action(`[${name}] ${CrudEnum.DELETE} `, payload<{ item: T }>());

    return {
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
    };
  }

  return {createCrudActions};
}
