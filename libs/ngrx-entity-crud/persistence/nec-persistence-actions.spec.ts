import {createSectionCheckSuccessAction, createSetSectionSaveModeAction} from './nec-persistence-actions';

describe('createSetSectionSaveModeAction', () => {
  it('produce un type scoped sulla feature', () => {
    const action = createSetSectionSaveModeAction('coins');
    expect(action.type).toBe('[coins Persistence] Set Section Save Mode');
  });

  it('porta il mode nel payload', () => {
    const action = createSetSectionSaveModeAction('coins');
    expect(action({mode: 'always'})).toEqual({type: '[coins Persistence] Set Section Save Mode', mode: 'always'});
  });
});

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
    const check = {stats: null, autoRestoreTriggered: false, saveMode: 'on-draft' as const};
    expect(action({check})).toEqual({type: '[coins Persistence] Section Check Success', check});
  });
});
