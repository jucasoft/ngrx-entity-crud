import {Injectable} from '@angular/core';
import {NecGridRuntimeStatus, NecTableGridEntry, NecTableReport, NecTableSummary} from '../models';

/**
 * Inventario statico delle tabelle del progetto (`table-report.json`, generato da
 * `ng generate ngrx-entity-crud:table-report --format=json`), correlato a runtime con le
 * slice montate nello store.
 *
 * Stesso pattern del lazy-report in `NecStoreProbeService`: `fetch` nativo (niente
 * HttpClient, così il probe non dipende da `provideHttpClient` nell'app consumer) e
 * degradazione silenziosa a `null` quando il report non è raggiungibile o non è valido —
 * la dashboard mostra lo stato vuoto col comando per generarlo.
 */
@Injectable({providedIn: 'root'})
export class NecTableReportProbeService {
  /**
   * Legge e normalizza il report. `mountedSliceKeys` sono le chiavi delle slice presenti
   * nello stato root (da `NecStoreProbeService.read().slices`), usate per calcolare il
   * `runtimeStatus` di ogni griglia.
   */
  async read(url: string, mountedSliceKeys: string[]): Promise<NecTableReport | null> {
    if (typeof fetch !== 'function') {
      return null;
    }
    let json: any;
    try {
      const res = await fetch(url, {headers: {Accept: 'application/json'}});
      if (!res.ok) {
        return null;
      }
      json = await res.json();
    } catch {
      return null;
    }
    if (!json || !Array.isArray(json.grids)) {
      return null;
    }

    const mounted = new Set(mountedSliceKeys);
    const grids = (json.grids as any[]).map((g) => this.toEntry(g, mounted));

    const s = json.summary;
    const summary: NecTableSummary | undefined =
      s && typeof s === 'object'
        ? {
            grids: Number(s.grids) || 0,
            agGrid: Number(s.agGrid) || 0,
            pTable: Number(s.pTable) || 0,
            orphans: Number(s.orphans) || 0,
            agGridEnterprise: !!s.agGridEnterprise,
          }
        : undefined;

    return {
      generatedAt: typeof json.generatedAt === 'string' ? json.generatedAt : undefined,
      summary,
      grids,
    };
  }

  private toEntry(g: any, mounted: Set<string>): NecTableGridEntry {
    const stores: string[] = Array.isArray(g?.stores)
      ? g.stores.filter((x: unknown) => typeof x === 'string')
      : [];
    const mountedStores = stores.filter(
      (s) => mounted.has(this.toSliceKey(s)) || mounted.has(s)
    );
    const runtimeStatus: NecGridRuntimeStatus =
      stores.length === 0
        ? 'no-store'
        : mountedStores.length === stores.length
          ? 'loaded'
          : mountedStores.length > 0
            ? 'partial'
            : 'not-loaded';
    const columns: any[] = Array.isArray(g?.columns) ? g.columns : [];
    return {
      component: typeof g?.component === 'string' ? g.component : '(unknown)',
      selector: typeof g?.selector === 'string' ? g.selector : null,
      file: typeof g?.file === 'string' ? g.file : '',
      kind: typeof g?.kind === 'string' ? g.kind : 'unknown',
      where: typeof g?.where === 'string' ? g.where : '',
      section: typeof g?.section === 'string' ? g.section : null,
      inlineTemplate: !!g?.inlineTemplate,
      stores,
      mountedStores,
      columnsCount: typeof g?.columnsCount === 'number' ? g.columnsCount : columns.length,
      columnsDynamicEntries:
        typeof g?.columnsDynamicEntries === 'number' ? g.columnsDynamicEntries : 0,
      columnsSource: typeof g?.columnsSource === 'string' ? g.columnsSource : null,
      colDefType: typeof g?.colDefType === 'string' ? g.colDefType : null,
      columnFields: columns
        .map((c) => (typeof c?.field === 'string' ? c.field : null))
        .filter((f): f is string => !!f),
      isOrphan: !!g?.isOrphan,
      verdict: typeof g?.verdict === 'string' ? g.verdict : null,
      runtimeStatus,
    };
  }

  /**
   * Best-effort: il root state usa `strings.underscore(name)` come chiave di slice, mentre il
   * report usa i nomi dasherizzati (stessa convenzione del lazy-report in
   * `NecStoreProbeService.toSliceKey`).
   */
  private toSliceKey(name: string): string {
    return (name ?? '').replace(/-/g, '_');
  }
}
