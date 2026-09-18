import {createSectionCheckSuccessAction} from './nec-persistence-actions';

describe('createSectionCheckSuccessAction', () => {
  it('produce un type scoped sulla feature', () => {
    const action = createSectionCheckSuccessAction('coins');
    expect(action.type).toBe('[coins Persistence] Section Check Success');
  });

  it('feature diverse producono type diversi', () => {
    const coins = createSectionCheckSuccessAction('coins');
    const orders = createSectionCheckSuccessAction('orders');
    expect(coins.type).not.toBe(orders.type);
  });

  it('porta il check nel payload', () => {
    const action = createSectionCheckSuccessAction('coins');
    const check = {stats: null, autoRestoreTriggered: false};
    expect(action({check})).toEqual({type: '[coins Persistence] Section Check Success', check});
  });
});
