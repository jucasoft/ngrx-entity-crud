import {NecPersistenceModule, provideNecPersistence} from './nec-persistence.module';
import {NEC_PERSISTENCE_CONFIG} from './persistence-config.token';

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
