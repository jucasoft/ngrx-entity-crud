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
    const check = {stats, autoRestoreTriggered: false, saveMode: 'on-draft' as const};
    const state = {[necPersistenceFeatureKey('coins')]: {check}};

    expect(selectors.sectionCheck(state)).toEqual(check);
  });

  it('slice assente (feature mai montata nello store): sectionCheck null invece di lanciare', () => {
    const selectors = createPersistenceSelectors('coins');
    const state = {};

    expect(selectors.sectionCheck(state)).toBeNull();
  });

  it('saveMode legge il campo dal check, default "on-draft" se nessun check ancora ricevuto', () => {
    const selectors = createPersistenceSelectors('coins');
    const noCheckState = {[necPersistenceFeatureKey('coins')]: NEC_PERSISTENCE_INITIAL_STATE};
    expect(selectors.saveMode(noCheckState)).toBe('on-draft');

    const check = {stats, autoRestoreTriggered: false, saveMode: 'always' as const};
    const state = {[necPersistenceFeatureKey('coins')]: {check}};
    expect(selectors.saveMode(state)).toBe('always');
  });

  it('due feature diverse leggono slice diverse', () => {
    const coinsSelectors = createPersistenceSelectors('coins');
    const ordersSelectors = createPersistenceSelectors('orders');
    const check = {stats, autoRestoreTriggered: true, saveMode: 'on-draft' as const};
    const state = {
      [necPersistenceFeatureKey('coins')]: {check},
      [necPersistenceFeatureKey('orders')]: NEC_PERSISTENCE_INITIAL_STATE,
    };

    expect(coinsSelectors.sectionCheck(state)).toEqual(check);
    expect(ordersSelectors.sectionCheck(state)).toBeNull();
  });
});
