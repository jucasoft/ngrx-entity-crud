import {inject, Injectable} from '@angular/core';
import {Store} from '@ngrx/store';
import {take} from 'rxjs/operators';
import {NecLazyEntry, NecSliceKind, NecStoreReport, NecStoreSlice} from '../models';

interface ProbeOptions {
  blacklist?: string[];
  whitelist?: string[];
}

/**
 * Riepilogo degli store NgRx a runtime.
 *
 * Enumera le slice CRUD montate per CONVENZIONE (`typeof value.isLoading === 'boolean'`,
 * vedi `EntityCrudBaseState`), senza dipendere dai selettori per-dominio. Una slice lazy non
 * ancora caricata semplicemente non ha la chiave nello stato root.
 */
@Injectable({providedIn: 'root'})
export class NecStoreProbeService {
  private readonly store = inject(Store);

  /** Lettura sincrona dello stato root (NgRx emette il valore corrente all'iscrizione). */
  read(opts: ProbeOptions = {}): NecStoreReport {
    const blacklist = opts.blacklist ?? [];
    const whitelist = opts.whitelist ?? [];

    let root: Record<string, any> = {};
    this.store
      .select((s) => s as Record<string, any>)
      .pipe(take(1))
      .subscribe((s) => (root = s ?? {}));

    const isEligible = (key: string): boolean =>
      whitelist.length > 0 ? whitelist.includes(key) : !blacklist.includes(key);

    const slices: NecStoreSlice[] = [];
    const loadingNames: string[] = [];
    const errors: string[] = [];

    for (const [key, value] of Object.entries(root)) {
      if (!isEligible(key)) {
        continue;
      }
      if (!value || typeof value !== 'object' || typeof value.isLoading !== 'boolean') {
        continue;
      }
      const v = value as Record<string, any>;
      const kind: NecSliceKind = Array.isArray(v['ids'])
        ? 'plural'
        : 'item' in v
          ? 'singular'
          : 'unknown';
      const error =
        typeof v['error'] === 'string' && v['error'].length > 0 ? (v['error'] as string) : null;

      const entityCount =
        kind === 'plural'
          ? Array.isArray(v['ids'])
            ? v['ids'].length
            : Object.keys(v['entities'] ?? {}).length
          : undefined;
      const responsesCount = Array.isArray(v['responses']) ? v['responses'].length : 0;
      const hasData =
        (entityCount ?? 0) > 0 || (kind === 'singular' && v['item'] != null) || responsesCount > 0;

      const slice: NecStoreSlice = {
        key,
        kind,
        isLoading: v['isLoading'] === true,
        isLoaded: v['isLoaded'] === true,
        error,
        entityCount,
        responsesCount,
        hasData,
      };
      slices.push(slice);
      if (slice.isLoading) {
        loadingNames.push(key);
      }
      if (slice.error) {
        errors.push(`${key}: ${slice.error}`);
      }
    }

    slices.sort((a, b) => a.key.localeCompare(b.key));
    // Verità dello stato root, NON filtrata: blacklist/whitelist scopano solo la vista `slices`
    // del pannello store, mentre le correlazioni (es. pannello Tables) devono vedere anche le
    // slice non-CRUD montate (es. `router`) e quelle nascoste dai filtri.
    const mountedKeys = Object.keys(root).sort();
    return {slices, loadingNames, errors, mountedKeys};
  }

  /**
   * Type dell'azione `Reset` della libreria per una slice CRUD.
   *
   * Vale la convenzione degli schematic `store`: la feature key nello stato root coincide col
   * nome passato a `createCrudActions` (entrambi `Names.NAME`), quindi il type `[key] Reset`
   * (vedi `actions.ts`, `CrudEnum.RESET`) è ricostruibile dalla sola `key` letta da {@link read}.
   */
  resetActionType(sliceKey: string): string {
    return `[${sliceKey}] Reset`;
  }

  /** Type dell'azione `ResetResponses` (`[key] Reset Response`): svuota solo la cache delle response. */
  resetResponsesActionType(sliceKey: string): string {
    return `[${sliceKey}] Reset Response`;
  }

  /**
   * Dispaccia il `Reset` della slice: riporta lo stato a `initialState` (entità, selezione,
   * criteri e response vuoti). La libreria di persistenza, reagendo al cambio di stato, riscrive
   * lo stato vuoto e di fatto svuota i dati salvati in locale.
   */
  reset(sliceKey: string): void {
    this.store.dispatch({type: this.resetActionType(sliceKey)});
  }

  /** Dispaccia il `ResetResponses` della slice: svuota solo le response, lasciando entità e selezione. */
  resetResponses(sliceKey: string): void {
    this.store.dispatch({type: this.resetResponsesActionType(sliceKey)});
  }

  /** Come `read()`, ma correla con l'inventario statico di `lazy-report.json` (se raggiungibile). */
  async readWithLazyReport(url: string, opts: ProbeOptions = {}): Promise<NecStoreReport> {
    const report = this.read(opts);
    const fetched = await this.fetchLazyReport(url, report);
    if (!fetched) {
      return report;
    }
    return {...report, lazy: fetched.entries, lazyReportGeneratedAt: fetched.generatedAt};
  }

  private async fetchLazyReport(
    url: string,
    report: NecStoreReport
  ): Promise<{entries: NecLazyEntry[]; generatedAt?: string} | undefined> {
    if (typeof fetch !== 'function') {
      return undefined;
    }
    let json: any;
    try {
      const res = await fetch(url, {headers: {Accept: 'application/json'}});
      if (!res.ok) {
        return undefined;
      }
      json = await res.json();
    } catch {
      return undefined;
    }

    const stores: any[] = Array.isArray(json?.stores) ? json.stores : [];
    const mounted = new Set(report.slices.map((s) => s.key));
    const generatedAt = typeof json?.generatedAt === 'string' ? json.generatedAt : undefined;

    const entries = stores.map((st): NecLazyEntry => {
      const sliceKey = this.toSliceKey(st?.name);
      const isLoaded = mounted.has(sliceKey) || mounted.has(st?.name);
      const isLazyCandidate =
        typeof st?.isLazyCandidate === 'boolean'
          ? st.isLazyCandidate
          : // Fallback per i report vecchi senza `isLazyCandidate`: verdetto testuale
            // in inglese (attuale) o in italiano (report generati prima della beta.14).
            /lazy candidate|candidato lazy/i.test(st?.verdict ?? '');
      return {
        name: st?.name,
        clazz: st?.clazz,
        type: st?.type,
        verdict: st?.verdict,
        isLazyCandidate,
        lazyRoute: typeof st?.lazyRoute === 'boolean' ? st.lazyRoute : undefined,
        sections: Array.isArray(st?.sections) ? st.sections : [],
        usedByShell: !!st?.usedByShell,
        runtimeStatus: isLoaded ? 'loaded' : isLazyCandidate ? 'lazy-not-loaded' : 'unknown',
      };
    });

    return {entries, generatedAt};
  }

  /**
   * Best-effort: il root state usa `strings.underscore(name)` come chiave di slice, mentre il
   * report usa il nome dasherizzato. (Fase 1: far emettere a `lazy-report` la feature key reale.)
   */
  private toSliceKey(name: string): string {
    return (name ?? '').replace(/-/g, '_');
  }
}
