import {ModuleWithProviders, NgModule, Provider} from '@angular/core';
import {NecPersistenceConfig} from './models';
import {NEC_PERSISTENCE_CONFIG} from './persistence-config.token';

/**
 * `forRoot` in stile `NgModule` per compatibilità Angular 16 (peerDeps da `^11.0.0`), dove le
 * sole funzioni `provide*` negli `ApplicationConfig` standalone non sono un'opzione.
 */
@NgModule({})
export class NecPersistenceModule {
  static forRoot(config: NecPersistenceConfig = {}): ModuleWithProviders<NecPersistenceModule> {
    return {
      ngModule: NecPersistenceModule,
      providers: provideNecPersistence(config),
    };
  }
}

/** Variante funzionale di `NecPersistenceModule.forRoot` per chi è su Angular 15+. */
export function provideNecPersistence(config: NecPersistenceConfig = {}): Provider[] {
  return [{provide: NEC_PERSISTENCE_CONFIG, useValue: config}];
}
