import {NecPersistenceModule, provideNecPersistence} from './nec-persistence.module';
import {NEC_DEFAULT_PERSISTENCE_CONFIG, NEC_PERSISTENCE_CONFIG} from './persistence-config.token';

describe('NEC_DEFAULT_PERSISTENCE_CONFIG', () => {
  it('dbVersion e\' 2 (schema con sectionPrefs, vedi decisione saveMode)', () => {
    expect(NEC_DEFAULT_PERSISTENCE_CONFIG.dbVersion).toBe(2);
  });
});

describe('NecPersistenceModule', () => {
  it('forRoot fornisce NEC_PERSISTENCE_CONFIG con il valore passato', () => {
    const {ngModule, providers} = NecPersistenceModule.forRoot({dbName: 'x'});

    expect(ngModule).toBe(NecPersistenceModule);
    expect(providers).toEqual([{provide: NEC_PERSISTENCE_CONFIG, useValue: {dbName: 'x'}}]);
  });

  it('forRoot senza argomenti fornisce un oggetto di configurazione vuoto', () => {
    const {providers} = NecPersistenceModule.forRoot();

    expect(providers).toEqual([{provide: NEC_PERSISTENCE_CONFIG, useValue: {}}]);
  });

  it('provideNecPersistence produce lo stesso provider della variante NgModule', () => {
    const providers = provideNecPersistence({debounceMs: 50});

    expect(providers).toEqual([{provide: NEC_PERSISTENCE_CONFIG, useValue: {debounceMs: 50}}]);
  });
});
