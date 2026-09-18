import {createPersistenceSelectors} from './nec-persistence-selectors';
import {NEC_PERSISTENCE_INITIAL_STATE, necPersistenceFeatureKey} from './nec-persistence-reducer';
import {NecSectionStats} from './models';

describe('createPersistenceSelectors', () => {
  const stats: NecSectionStats = {feature: 'coins', count: 10, bytes: 500, draftCount: 0, at: Date.now()};

  it('slice montata ma nessun check ancora ricevuto: sectionCheck null', () => {
    const selectors = createPersistenceSelectors('coins');
    const state = {[necPersistenceFeatureKey('coins')]: NEC_PERSISTENCE_INITIAL_STATE};

    expect(selectors.sectionCheck(state)).toBeNull();
  });

  it('sectionCheck legge il check scritto nella slice', () => {
    const selectors = createPersistenceSelectors('coins');
    const check = {stats, autoRestoreTriggered: false};
    const state = {[necPersistenceFeatureKey('coins')]: {check}};

    expect(selectors.sectionCheck(state)).toEqual(check);
  });

  it('due feature diverse leggono slice diverse', () => {
    const coinsSelectors = createPersistenceSelectors('coins');
    const ordersSelectors = createPersistenceSelectors('orders');
    const check = {stats, autoRestoreTriggered: true};
    const state = {
      [necPersistenceFeatureKey('coins')]: {check},
      [necPersistenceFeatureKey('orders')]: NEC_PERSISTENCE_INITIAL_STATE,
    };

    expect(coinsSelectors.sectionCheck(state)).toEqual(check);
    expect(ordersSelectors.sectionCheck(state)).toBeNull();
  });
});
