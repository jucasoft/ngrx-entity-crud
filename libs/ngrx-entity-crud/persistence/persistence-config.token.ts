import {InjectionToken} from '@angular/core';
import {NecPersistenceConfig} from './models';

/** Default se il consumer non configura nulla: nessun `autoRestore` (sempre gesto esplicito). */
export const NEC_DEFAULT_PERSISTENCE_CONFIG: NecPersistenceConfig = {
  dbName: 'nec-persistence',
  // 2: aggiunge l'object store sectionPrefs (preferenza saveMode per sezione). onupgradeneeded e'
  // idempotente sugli store esistenti, chi ha gia' il DB in versione 1 aggiorna senza perdere dati.
  dbVersion: 2,
  debounceMs: 200,
  openTimeoutMs: 10000,
  enabled: true,
};

/**
 * Configurazione globale del layer di persistenza. Opt-in: se non fornita via
 * `NecPersistenceModule.forRoot()` / `provideNecPersistence()`, si usa
 * `NEC_DEFAULT_PERSISTENCE_CONFIG` — nessun ripristino automatico da nessuna parte
 * (decisione 12 del piano).
 */
export const NEC_PERSISTENCE_CONFIG = new InjectionToken<NecPersistenceConfig>('NEC_PERSISTENCE_CONFIG', {
  providedIn: 'root',
  factory: () => NEC_DEFAULT_PERSISTENCE_CONFIG,
});
