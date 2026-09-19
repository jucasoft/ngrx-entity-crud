import {createSectionCheckSuccessAction, createSetSectionSaveModeAction} from './nec-persistence-actions';
import {createPersistenceReducer, NEC_PERSISTENCE_INITIAL_STATE, necPersistenceFeatureKey} from './nec-persistence-reducer';
import {NecSectionStats} from './models';

describe('necPersistenceFeatureKey', () => {
  it('aggiunge il suffisso :persistence', () => {
    expect(necPersistenceFeatureKey('coins')).toBe('coins:persistence');
  });
});

describe('createPersistenceReducer', () => {
  const stats: NecSectionStats = {feature: 'coins', count: 10, bytes: 500, draftCount: 0, at: Date.now()};

  it('stato iniziale: check null', () => {
    const reducer = createPersistenceReducer('coins');
    expect(reducer(undefined, {type: '@@INIT'})).toEqual(NEC_PERSISTENCE_INITIAL_STATE);
  });

  it('SectionCheckSuccess della propria feature: scrive check', () => {
    const reducer = createPersistenceReducer('coins');
    const sectionCheckSuccess = createSectionCheckSuccessAction('coins');
    const check = {stats, autoRestoreTriggered: true, saveMode: 'on-draft' as const};

    const state = reducer(undefined, sectionCheckSuccess({check}));

    expect(state).toEqual({check});
  });

  it('SectionCheckSuccess di un\'altra feature: nessun effetto (type diverso, nessun filtro manuale necessario)', () => {
    const reducer = createPersistenceReducer('coins');
    const otherFeatureCheckSuccess = createSectionCheckSuccessAction('orders');

    const state = reducer(undefined, otherFeatureCheckSuccess({check: {stats, autoRestoreTriggered: true, saveMode: 'on-draft'}}));

    expect(state).toEqual(NEC_PERSISTENCE_INITIAL_STATE);
  });

  it('SetSectionSaveMode aggiorna saveMode nel check esistente, senza toccare stats/autoRestoreTriggered', () => {
    const reducer = createPersistenceReducer('coins');
    const sectionCheckSuccess = createSectionCheckSuccessAction('coins');
    const setSectionSaveMode = createSetSectionSaveModeAction('coins');
    const check = {stats, autoRestoreTriggered: true, saveMode: 'on-draft' as const};
    const afterCheck = reducer(undefined, sectionCheckSuccess({check}));

    const state = reducer(afterCheck, setSectionSaveMode({mode: 'always'}));

    expect(state).toEqual({check: {...check, saveMode: 'always'}});
  });

  it('SetSectionSaveMode prima di ogni check: crea un check minimale con solo saveMode impostato', () => {
    const reducer = createPersistenceReducer('coins');
    const setSectionSaveMode = createSetSectionSaveModeAction('coins');

    const state = reducer(undefined, setSectionSaveMode({mode: 'always'}));

    expect(state).toEqual({check: {stats: null, autoRestoreTriggered: false, saveMode: 'always'}});
  });
});
