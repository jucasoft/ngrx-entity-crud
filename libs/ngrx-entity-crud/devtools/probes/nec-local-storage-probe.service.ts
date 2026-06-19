import {Injectable} from '@angular/core';
import {NecQuotaEstimate, NecStorageEntry, NecStorageReport} from '../models';

/**
 * Riepilogo di `localStorage` / `sessionStorage`.
 *
 * Sincrono per la lettura delle chiavi. NON espone i valori: solo chiavi e dimensioni
 * (privacy). La metrica primaria verso la quota è UTF-16 `(key.length + value.length) * 2`,
 * perché è ciò che conta verso il limite ~5-10MB; la metrica UTF-8 è secondaria.
 */
@Injectable({providedIn: 'root'})
export class NecLocalStorageProbeService {
  read(type: 'local' | 'session' = 'local'): NecStorageReport {
    const empty: NecStorageReport = {
      available: false,
      type,
      entries: [],
      count: 0,
      totalBytesUtf16: 0,
      totalBytesUtf8: 0,
    };

    if (typeof window === 'undefined') {
      return empty;
    }

    let storage: Storage | null = null;
    try {
      storage = type === 'local' ? window.localStorage : window.sessionStorage;
    } catch {
      // accesso negato (sandbox/incognito/policy)
      return empty;
    }
    if (!storage) {
      return empty;
    }

    const entries: NecStorageEntry[] = [];
    let totalBytesUtf16 = 0;
    let totalBytesUtf8 = 0;

    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key == null) {
          continue;
        }
        const value = storage.getItem(key) ?? '';
        const bytesUtf16 = (key.length + value.length) * 2;
        const bytesUtf8 = this.utf8Bytes(key + value);
        totalBytesUtf16 += bytesUtf16;
        totalBytesUtf8 += bytesUtf8;
        entries.push({key, bytesUtf16, bytesUtf8});
      }
    } catch {
      // accesso parziale negato: ritorna ciò che è stato raccolto finora
    }

    entries.sort((a, b) => b.bytesUtf16 - a.bytesUtf16);

    return {
      available: true,
      type,
      entries,
      count: entries.length,
      totalBytesUtf16,
      totalBytesUtf8,
    };
  }

  /**
   * Legge ON-DEMAND il valore grezzo di una singola chiave (per il reveal esplicito in UI).
   * Non viene mai incluso nel report: la dashboard lo richiede solo su azione dell'utente e lo
   * maschera tramite `maskValue`.
   */
  readValue(key: string, type: 'local' | 'session' = 'local'): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    try {
      const storage = type === 'local' ? window.localStorage : window.sessionStorage;
      return storage ? storage.getItem(key) : null;
    } catch {
      return null;
    }
  }

  /**
   * Stima quota AGGREGATA per-origine (include anche IndexedDB e Cache): NON è scorporabile
   * per area. Può essere assente (Safari/contesto non sicuro) o arrotondata (anti-fingerprint).
   */
  async estimate(): Promise<NecQuotaEstimate> {
    const empty: NecQuotaEstimate = {available: false};
    if (
      typeof navigator === 'undefined' ||
      !navigator.storage ||
      typeof navigator.storage.estimate !== 'function'
    ) {
      return empty;
    }
    try {
      const est = await navigator.storage.estimate();
      return {
        available: true,
        usage: est.usage,
        quota: est.quota,
        usageDetails: (est as {usageDetails?: Record<string, number>}).usageDetails,
      };
    } catch {
      return empty;
    }
  }

  private utf8Bytes(s: string): number {
    try {
      if (typeof TextEncoder !== 'undefined') {
        return new TextEncoder().encode(s).length;
      }
    } catch {
      /* noop */
    }
    try {
      if (typeof Blob !== 'undefined') {
        return new Blob([s]).size;
      }
    } catch {
      /* noop */
    }
    return s.length;
  }
}
