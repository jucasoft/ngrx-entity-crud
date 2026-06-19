import {InjectionToken} from '@angular/core';
import {NecIdbAdapter} from './models';

/**
 * Adapter IndexedDB OPZIONALE, agnostico rispetto alla libreria di persistenza.
 *
 * Fornendolo, il `NecIndexedDbProbeService` lo usa con priorità per enumerare i database
 * (utile quando la libreria del consumer nasconde i nomi DB o su browser senza
 * `indexedDB.databases()`, es. Firefox). Quando NON fornito, il probe usa solo le API native.
 */
export const NEC_IDB_ADAPTER = new InjectionToken<NecIdbAdapter>('NEC_IDB_ADAPTER');
