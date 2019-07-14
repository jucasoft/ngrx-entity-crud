import {Coin} from '@models/vo/coin';
import {createCrudEntityAdapter, EntityCrudAdapter, EntityCrudState} from 'ngrx-entity-crud';

export const adapter: EntityCrudAdapter<Coin> = createCrudEntityAdapter<Coin>({
  selectId: model => model.id
});

export interface State extends EntityCrudState<Coin> {
}

export const initialState: State = adapter.getInitialCrudState();
