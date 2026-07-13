import {Injectable} from '@angular/core';
import {NecGridHandle, NecGridHandleMeta, NecLiveGridEntry} from './models';

/**
 * Registry runtime OPT-IN delle griglie ag-Grid: le istanze non sono enumerabili
 * dall'esterno, quindi ogni griglia si registra esplicitamente in `onGridReady`
 * (stesso principio dell'adapter `NEC_IDB_ADAPTER`). Due righe nel consumer:
 *
 * ```ts
 * onGridReady(params: GridReadyEvent) {
 *   this.gridUnregister = this.gridRegistry.register('product-browser', params.api,
 *     {store: 'product_browser', component: 'ProductBrowserListComponent'});
 * }
 * ngOnDestroy() { this.gridUnregister?.(); }
 * ```
 *
 * `register` accetta qualunque oggetto compatibile per STRUTTURA con `NecGridHandle`
 * (le `GridApi` di ag-Grid 31+ lo sono): la libreria non dipende da ag-grid. La lettura
 * (`read()`) è pull-based e difensiva — ogni metodo dell'handle è opzionale e incapsulato
 * in try/catch, gli handle distrutti (`isDestroyed()`) vengono rimossi automaticamente —
 * quindi un handle rotto degrada a valori `null`, mai a un errore della dashboard.
 * Il pannello "Live grids" di `<nec-dashboard>` legge il registry a ogni refresh.
 */
@Injectable({providedIn: 'root'})
export class NecGridRegistryService {
  private readonly entries = new Map<
    number,
    {key: string; handle: NecGridHandle; meta: NecGridHandleMeta; registeredAt: string}
  >();
  private seq = 0;

  /**
   * Registra una griglia e ritorna la funzione di de-registrazione (da chiamare in
   * `ngOnDestroy`; in sua assenza l'handle distrutto viene comunque espulso al primo
   * `read()` grazie a `isDestroyed()`). `key` identifica la griglia nel pannello e può
   * ripetersi (es. più istanze dello stesso componente): ogni registrazione ha un id proprio.
   */
  register(key: string, handle: NecGridHandle, meta: NecGridHandleMeta = {}): () => void {
    // Rete di sicurezza per i disposer dimenticati: senza dashboard aperta nessuno chiama
    // read(), quindi ogni nuovo mount spazza gli handle morti per limitare l'accumulo.
    this.evictDestroyed();
    const id = ++this.seq;
    this.entries.set(id, {key, handle, meta, registeredAt: new Date().toISOString()});
    return () => {
      this.entries.delete(id);
    };
  }

  /** Snapshot difensivo di tutte le griglie registrate; espelle gli handle distrutti. */
  read(): NecLiveGridEntry[] {
    this.evictDestroyed();
    const out: NecLiveGridEntry[] = [];
    for (const [id, e] of this.entries) {
      const filterModel = this.callSafe(() => e.handle.getFilterModel?.());
      const columnState = this.callSafe(() => e.handle.getColumnState?.());
      out.push({
        id,
        key: e.key,
        store: e.meta.store ?? null,
        component: e.meta.component ?? null,
        displayedRows: this.callSafe(() => e.handle.getDisplayedRowCount?.()) ?? null,
        selectedCount: this.callSafe(() => e.handle.getSelectedRows?.().length) ?? null,
        // undefined = non leggibile (metodo assente o che lancia) -> null;
        // null esplicito = "nessun filtro" per gli handle che lo usano al posto di {} -> 0.
        filterCount:
          filterModel === undefined ? null : filterModel === null ? 0 : Object.keys(filterModel).length,
        // null = column state non leggibile (diverso da []: leggibile e senza sort attivi).
        sortedColumns: Array.isArray(columnState)
          ? columnState
              .filter((c) => !!c && (c.sort === 'asc' || c.sort === 'desc'))
              .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0))
              .map((c) => `${c.colId} ${c.sort}`)
          : null,
        registeredAt: e.registeredAt,
      });
    }
    return out;
  }

  /** Dimentica le griglie distrutte senza unregister (niente righe zombie né accumulo). */
  private evictDestroyed(): void {
    for (const [id, e] of this.entries) {
      if (this.callSafe(() => e.handle.isDestroyed?.()) === true) {
        this.entries.delete(id);
      }
    }
  }

  /** Autosize di tutte le colonne della griglia registrata con `id`. */
  autoSizeColumns(id: number): boolean {
    return this.act(id, (h) => h.autoSizeAllColumns?.());
  }

  /** Azzera il filter model della griglia (`setFilterModel(null)`). */
  clearFilters(id: number): boolean {
    return this.act(id, (h) => h.setFilterModel?.(null));
  }

  /** Deseleziona tutte le righe della griglia. */
  clearSelection(id: number): boolean {
    return this.act(id, (h) => h.deselectAll?.());
  }

  /** `true` se la registrazione esiste e l'azione non ha lanciato (metodo assente = no-op ok). */
  private act(id: number, action: (handle: NecGridHandle) => unknown): boolean {
    const entry = this.entries.get(id);
    if (!entry) {
      return false;
    }
    try {
      action(entry.handle);
      return true;
    } catch {
      return false;
    }
  }

  /** Esegue una lettura sull'handle assorbendo qualunque eccezione (`undefined` = non leggibile). */
  private callSafe<T>(fn: () => T | undefined): T | undefined {
    try {
      return fn();
    } catch {
      return undefined;
    }
  }
}
