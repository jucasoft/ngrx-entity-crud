import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

// jest-environment-jsdom non espone `structuredClone` nel suo global scope (anche quando Node
// ce l'ha), e `fake-indexeddb` (usato dai test di `persistence/`) lo richiede per clonare i
// valori come farebbe un vero IndexedDB. Round-trip JSON: sufficiente per i dati semplici che
// passano di lì, non per Date/Map/ArrayBuffer.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
}
