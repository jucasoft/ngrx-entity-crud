import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';
import {TreeModule} from 'primeng/tree';
import {TreeNode} from 'primeng/api';
import {NecIdbReport, NecIdbStoreEntries, NecQuotaEstimate, NecStorageReport, NecStoreReport} from './models';
import {NecLocalStorageProbeService} from './probes/nec-local-storage-probe.service';
import {NecIndexedDbProbeService} from './probes/nec-indexeddb-probe.service';
import {NecStoreProbeService} from './probes/nec-store-probe.service';
import {looksSensitiveKey, maskValue} from './mask';

/**
 * `<nec-dashboard>` — dashboard di gestione progetto plug-and-play.
 *
 * Standalone, OnPush, costruita sui componenti **PrimeNG** (`p-card`, `p-table`, `p-tag`,
 * `p-tree`, direttiva `pButton`): richiede quindi `primeng` + `primeicons` nell'app consumer
 * (peerDependencies opzionali del solo entry-point `devtools`). Quattro pannelli: quota
 * origine, localStorage, IndexedDB (agnostico, con `p-tree` espandibile e lazy-load dei
 * record), store NgRx + sezioni lazy. Per privacy mostra di default SOLO chiavi/dimensioni/
 * conteggi; i valori (localStorage e record IndexedDB) sono rivelabili solo con
 * `allowRevealValues` e comunque mascherati. Refresh manuale di default; polling opt-in via
 * `pollingMs`. Usabile anche in produzione.
 *
 * I pulsanti usano la direttiva `pButton` con le **classi** severity (`p-button-danger`,
 * `-text`, `-sm`) e i tag solo le severity `success`/`info`/`danger`: questo idioma è
 * compatibile sia con PrimeNG 16 (target dell'app consumer) sia con le major successive.
 * Il template usa le direttive strutturali classiche (`*ngIf`/`*ngFor`) anziché il
 * control-flow `@if`/`@for`, per restare compatibile con Angular 16+.
 */
@Component({
  selector: 'nec-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, TableModule, TagModule, TreeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: system-ui, sans-serif;
        font-size: 13px;
        color: #1f2933;
      }
      .nec-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .nec-mb {
        margin-bottom: 16px;
      }
      .nec-note {
        color: #7b8794;
        font-style: italic;
      }
      .nec-num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .nec-ml {
        margin-left: 6px;
      }
      .nec-idb-value {
        margin: 4px 0;
        padding: 6px 8px;
        background: #f5f7fa;
        border: 1px solid #eceff3;
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 240px;
        overflow: auto;
        font-size: 12px;
      }
    `,
  ],
  template: `
    <div class="nec-row nec-mb">
      <button
        type="button"
        pButton
        class="p-button-sm"
        icon="pi pi-refresh"
        [label]="busy() ? 'Aggiorno…' : 'Aggiorna'"
        [disabled]="busy()"
        (click)="refresh()"
      ></button>
      <ng-container *ngIf="storeReport()?.slices?.length">
        <ng-container *ngIf="pendingResetAll(); else resetAllBtn">
          <span class="nec-note" role="alert">azzerare tutte le slice?</span>
          <button type="button" pButton class="p-button-danger p-button-sm" label="Sì"
                  aria-label="Conferma azzeramento di tutte le slice" (click)="confirmResetAll()"></button>
          <button type="button" pButton class="p-button-text p-button-sm" label="Annulla"
                  aria-label="Annulla azzeramento" (click)="cancelPending()"></button>
        </ng-container>
        <ng-template #resetAllBtn>
          <button type="button" pButton class="p-button-danger p-button-sm" icon="pi pi-trash"
                  label="Azzera tutte" (click)="requestResetAll()"></button>
        </ng-template>
      </ng-container>
      <span class="nec-note" *ngIf="lastUpdated()">ultimo aggiornamento: {{ lastUpdated() }}</span>
    </div>

    <!-- Quota aggregata origine -->
    <div class="nec-mb">
      <p-card header="Quota origine (aggregata)">
        <ng-container *ngIf="quota()?.available; else noQuota">
          <div>
            uso: <strong>{{ formatBytes(quota()?.usage) }}</strong> /
            quota: <strong>{{ formatBytes(quota()?.quota) }}</strong>
          </div>
          <div class="nec-note">
            Stima per-origine: include localStorage + IndexedDB + Cache, non scorporabile.
          </div>
        </ng-container>
        <ng-template #noQuota>
          <div class="nec-note">Stima quota non disponibile (Safari o contesto non sicuro).</div>
        </ng-template>
      </p-card>
    </div>

    <!-- localStorage -->
    <div class="nec-mb">
      <p-card header="localStorage">
        <ng-container *ngIf="storage()?.available; else noLocalStorage">
          <div class="nec-mb">
            {{ storage()?.count }} chiavi · totale
            <strong>{{ formatBytes(storage()?.totalBytesUtf16) }}</strong> (UTF-16) /
            {{ formatBytes(storage()?.totalBytesUtf8) }} (UTF-8)
          </div>
          <p-table *ngIf="storage()!.entries.length; else noLocalStorageEntries"
                   [value]="storage()!.entries" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>chiave</th>
                <th class="nec-num">UTF-16</th>
                <th class="nec-num">UTF-8</th>
                <th *ngIf="allowRevealValues">valore</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-e>
              <tr>
                <td>
                  {{ e.key }}
                  <i class="pi pi-exclamation-triangle nec-ml" style="color:#b91c1c"
                     title="chiave potenzialmente sensibile" *ngIf="isSensitive(e.key)"></i>
                </td>
                <td class="nec-num">{{ formatBytes(e.bytesUtf16) }}</td>
                <td class="nec-num">{{ formatBytes(e.bytesUtf8) }}</td>
                <td *ngIf="allowRevealValues">
                  <ng-container *ngIf="revealed()[e.key] !== undefined; else revealBtn">
                    <code>{{ revealed()[e.key] }}</code>
                  </ng-container>
                  <ng-template #revealBtn>
                    <button type="button" pButton class="p-button-text p-button-sm" label="mostra"
                            (click)="reveal(e.key)"></button>
                  </ng-template>
                </td>
              </tr>
            </ng-template>
          </p-table>
          <ng-template #noLocalStorageEntries>
            <div class="nec-note">Nessuna chiave.</div>
          </ng-template>
        </ng-container>
        <ng-template #noLocalStorage>
          <div class="nec-note">localStorage non disponibile.</div>
        </ng-template>
      </p-card>
    </div>

    <!-- IndexedDB -->
    <div class="nec-mb">
      <p-card header="IndexedDB">
        <ng-container *ngIf="idb()?.available; else noIdb">
          <div class="nec-note">adapter: {{ idb()?.adapter }}</div>
          <div class="nec-note nec-mb" *ngIf="idb()?.note">{{ idb()?.note }}</div>
          <p-tree
            *ngIf="idbTreeNodes().length; else noDatabases"
            [value]="idbTreeNodes()"
            [lazy]="true"
            [loading]="idbLoading()"
            (onNodeExpand)="onNodeExpand($event)"
          >
            <ng-template let-node pTemplate="store">
              {{ node.data.store }}
              <p-tag styleClass="nec-ml" severity="info"
                     [value]="(node.data.count == null ? '–' : node.data.count) + ' record'"></p-tag>
            </ng-template>
            <ng-template let-node pTemplate="record">
              <code>{{ node.label }}</code>
            </ng-template>
            <ng-template let-node pTemplate="value">
              <pre class="nec-idb-value">{{ node.label }}</pre>
            </ng-template>
            <ng-template let-node pTemplate="note">
              <span class="nec-note">{{ node.label }}</span>
            </ng-template>
          </p-tree>
          <ng-template #noDatabases>
            <div class="nec-note">Nessun database elencabile.</div>
          </ng-template>
          <div class="nec-note" *ngIf="!allowRevealValues">
            I valori dei record sono nascosti: imposta <code>[allowRevealValues]="true"</code> per
            espandere ogni record e vederne il contenuto (mascherato).
          </div>
        </ng-container>
        <ng-template #noIdb>
          <div class="nec-note">IndexedDB non disponibile in questo contesto.</div>
        </ng-template>
      </p-card>
    </div>

    <!-- Store NgRx + lazy -->
    <div class="nec-mb">
      <p-card header="Store NgRx">
        <ng-container *ngIf="storeReport()">
          <ng-container *ngIf="storeReport()!.slices.length; else noSlices">
            <div class="nec-row nec-mb">
              <button
                type="button"
                pButton
                class="p-button-sm"
                [class.p-button-outlined]="!onlyWithData()"
                [label]="onlyWithData() ? 'Mostra tutte le slice' : 'Mostra solo le slice con dati'"
                (click)="toggleOnlyWithData()"
              ></button>
              <span class="nec-note" *ngIf="onlyWithData()">
                {{ visibleSlices().length }} di {{ storeReport()!.slices.length }} slice
              </span>
            </div>
            <p-table *ngIf="visibleSlices().length; else noDataSlices"
                     [value]="visibleSlices()" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>slice</th>
                  <th>tipo</th>
                  <th class="nec-num">entità</th>
                  <th class="nec-num">responses</th>
                  <th>stato</th>
                  <th>azioni</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-s>
                <tr>
                  <td>{{ s.key }}</td>
                  <td>{{ s.kind }}</td>
                  <td class="nec-num">{{ s.entityCount ?? '–' }}</td>
                  <td class="nec-num">{{ s.responsesCount }}</td>
                  <td>
                    <span [title]="s.error || ''">
                      <p-tag *ngIf="s.isLoading" severity="info" value="loading"></p-tag>
                      <p-tag *ngIf="s.error" severity="danger" value="error"></p-tag>
                      <p-tag *ngIf="!s.isLoading && !s.error"
                             [severity]="s.isLoaded ? 'success' : 'info'"
                             [value]="s.isLoaded ? 'caricato' : 'idle'"></p-tag>
                    </span>
                  </td>
                  <td>
                    <div class="nec-row">
                      <ng-container *ngIf="pendingResetKey() === s.key">
                        <span class="nec-note" role="alert">azzerare la slice?</span>
                        <button type="button" pButton class="p-button-danger p-button-sm" label="Sì"
                                [attr.aria-label]="'Conferma azzeramento della slice ' + s.key"
                                (click)="confirmReset(s.key)"></button>
                        <button type="button" pButton class="p-button-text p-button-sm" label="Annulla"
                                aria-label="Annulla azzeramento" (click)="cancelPending()"></button>
                      </ng-container>
                      <ng-container *ngIf="pendingResponsesKey() === s.key">
                        <span class="nec-note" role="alert">azzerare le responses?</span>
                        <button type="button" pButton class="p-button-danger p-button-sm" label="Sì"
                                [attr.aria-label]="'Conferma azzeramento delle responses di ' + s.key"
                                (click)="confirmResetResponses(s.key)"></button>
                        <button type="button" pButton class="p-button-text p-button-sm" label="Annulla"
                                aria-label="Annulla azzeramento" (click)="cancelPending()"></button>
                      </ng-container>
                      <ng-container *ngIf="pendingResetKey() !== s.key && pendingResponsesKey() !== s.key">
                        <button type="button" pButton class="p-button-danger p-button-text p-button-sm"
                                icon="pi pi-trash" label="reset"
                                [attr.aria-label]="'Azzera la slice ' + s.key" (click)="requestReset(s.key)"></button>
                        <button type="button" pButton class="p-button-text p-button-sm" label="reset responses"
                                [attr.aria-label]="'Azzera le responses di ' + s.key"
                                (click)="requestResetResponses(s.key)"></button>
                      </ng-container>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
            <ng-template #noDataSlices>
              <div class="nec-note">Nessuna slice con dati caricati.</div>
            </ng-template>
          </ng-container>
          <ng-template #noSlices>
            <div class="nec-note">Nessuna slice CRUD montata.</div>
          </ng-template>

          <ng-container *ngIf="storeReport()!.lazy?.length; else noLazy">
            <h4 style="margin: 16px 0 8px">Sezioni lazy (da lazy-report)</h4>
            <div class="nec-note nec-mb" *ngIf="storeReport()!.lazyReportGeneratedAt">
              snapshot generato il {{ storeReport()!.lazyReportGeneratedAt }} — rigenera con
              <code>ng generate ngrx-entity-crud:lazy-report --format=json</code> se obsoleto.
            </div>
            <p-table [value]="storeReport()!.lazy!" styleClass="p-datatable-sm">
              <ng-template pTemplate="header">
                <tr>
                  <th>store</th>
                  <th>sezioni</th>
                  <th>verdetto</th>
                  <th>runtime</th>
                </tr>
              </ng-template>
              <ng-template pTemplate="body" let-l>
                <tr>
                  <td>{{ l.name }}</td>
                  <td>{{ l.sections.join(', ') || '–' }}</td>
                  <td>{{ l.verdict }}</td>
                  <td>
                    <p-tag [severity]="l.runtimeStatus === 'loaded' ? 'success' : 'info'"
                           [value]="l.runtimeStatus"></p-tag>
                  </td>
                </tr>
              </ng-template>
            </p-table>
          </ng-container>
          <ng-template #noLazy>
            <div class="nec-note">
              Nessun lazy-report caricato (genera src/assets/lazy-report.json con
              <code>ng generate ngrx-entity-crud:lazy-report --format=json</code>).
            </div>
          </ng-template>
        </ng-container>
      </p-card>
    </div>
  `,
})
export class NecDashboardComponent implements OnInit, OnDestroy {
  private readonly localStorageProbe = inject(NecLocalStorageProbeService);
  private readonly indexedDbProbe = inject(NecIndexedDbProbeService);
  private readonly storeProbe = inject(NecStoreProbeService);

  /** Chiavi di slice da escludere dallo scan dello store. */
  @Input() blacklist: string[] = [];
  /** Se valorizzata, considera SOLO queste chiavi di slice (precede la blacklist). */
  @Input() whitelist: string[] = [];
  /** URL del report statico (`lazy-report --format=json`); `null`/'' per disattivarlo. */
  @Input() lazyReportUrl: string | null = 'assets/lazy-report.json';
  /** Nomi DB IndexedDB da ispezionare dove `databases()` non è supportato (es. Firefox). */
  @Input() idbDatabaseNames: string[] = [];
  /** Intervallo di auto-refresh in ms; 0 = solo manuale (default). */
  @Input() pollingMs = 0;
  /** Abilita il reveal opt-in dei valori localStorage e dei record IndexedDB (sempre mascherati). Default: false. */
  @Input() allowRevealValues = false;
  /** Numero massimo di record letti per object store nella vista ad albero IndexedDB. Default: 50. */
  @Input() idbEntryLimit = 50;

  /** Emesso (con la slice key) a ogni `Reset` completo dispacciato, incluso l'azzera-tutte. */
  @Output() sliceReset = new EventEmitter<string>();

  readonly busy = signal(false);
  readonly lastUpdated = signal<string | null>(null);
  readonly storage = signal<NecStorageReport | null>(null);
  readonly quota = signal<NecQuotaEstimate | null>(null);
  readonly idb = signal<NecIdbReport | null>(null);
  readonly storeReport = signal<NecStoreReport | null>(null);
  readonly revealed = signal<Record<string, string>>({});
  /** Slice in attesa di conferma per il `Reset` completo (conferma a due step). */
  readonly pendingResetKey = signal<string | null>(null);
  /** Slice in attesa di conferma per il `ResetResponses`. */
  readonly pendingResponsesKey = signal<string | null>(null);
  /** `true` quando è in attesa di conferma l'azzeramento globale di tutte le slice. */
  readonly pendingResetAll = signal(false);

  /** `true` per mostrare solo le slice che contengono dati (filtro del pannello Store NgRx). */
  readonly onlyWithData = signal(false);
  /** Slice visibili in base al filtro `onlyWithData`. */
  readonly visibleSlices = computed(() => {
    const all = this.storeReport()?.slices ?? [];
    return this.onlyWithData() ? all.filter((s) => s.hasData) : all;
  });

  /** Nodi `p-tree` della vista IndexedDB (DB → object store; i record sono lazy-load). */
  readonly idbTreeNodes = signal<TreeNode[]>([]);
  /** `true` mentre `p-tree` sta caricando i record di un object store espanso. */
  readonly idbLoading = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  /** Un refresh richiesto mentre un altro è già in corso: viene ri-eseguito al termine. */
  private pendingRefresh = false;

  ngOnInit(): void {
    void this.refresh();
    if (this.pollingMs > 0) {
      this.timer = setInterval(() => void this.refresh(), this.pollingMs);
    }
  }

  ngOnDestroy(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async refresh(): Promise<void> {
    if (this.busy()) {
      // Un refresh è già in corso (es. polling): richiedine uno al termine così i conteggi
      // post-reset non restano stantii se il dispatch arriva mentre l'altro è in volo.
      this.pendingRefresh = true;
      return;
    }
    this.busy.set(true);
    this.revealed.set({}); // i valori rivelati non sopravvivono a un refresh
    this.idbLoading.set(false);
    this.cancelPending(); // nessuna conferma "appesa" dopo un refresh/polling
    try {
      this.storage.set(this.localStorageProbe.read('local'));
      this.quota.set(await this.localStorageProbe.estimate());
      this.idb.set(await this.indexedDbProbe.read(this.idbDatabaseNames));
      // L'albero si ricostruisce: collassato e con la cache record svuotata (sarebbe stantia).
      this.idbTreeNodes.set(this.buildIdbTree(this.idb()));

      const opts = {blacklist: this.blacklist, whitelist: this.whitelist};
      if (this.lazyReportUrl) {
        this.storeReport.set(await this.storeProbe.readWithLazyReport(this.lazyReportUrl, opts));
      } else {
        this.storeReport.set(this.storeProbe.read(opts));
      }
      this.lastUpdated.set(new Date().toLocaleTimeString());
    } finally {
      this.busy.set(false);
      if (this.pendingRefresh) {
        this.pendingRefresh = false;
        void this.refresh();
      }
    }
  }

  /** Reveal opt-in di un valore localStorage, sempre passato per `maskValue` (privacy). */
  reveal(key: string): void {
    const value = this.localStorageProbe.readValue(key) ?? '';
    this.revealed.update((m) => ({...m, [key]: maskValue(key, value)}));
  }

  // --- Filtro slice (pannello Store NgRx) ---------------------------------------------------

  /** Alterna fra "tutte le slice" e "solo le slice con dati". */
  toggleOnlyWithData(): void {
    this.onlyWithData.update((v) => !v);
  }

  // --- Vista ad albero IndexedDB (p-tree, lazy) ---------------------------------------------

  /** Costruisce i nodi DB → object store dal report; i record restano vuoti (lazy-load). */
  private buildIdbTree(report: NecIdbReport | null): TreeNode[] {
    const databases = report?.databases ?? [];
    return databases.map((db): TreeNode => {
      const storeNodes: TreeNode[] = db.stores.map((st) => ({
        label: st.name,
        type: 'store',
        data: {db: db.name, store: st.name, count: st.count},
        leaf: st.count === 0, // store vuoto: nessun figlio da caricare
        children: [],
      }));
      const noStores = db.stores.length === 0;
      return {
        label: noStores
          ? `${db.name}  ·  v${db.version ?? '?'}  —  ${db.note ?? 'nessun object store'}`
          : `${db.name}  ·  v${db.version ?? '?'}  ·  ${db.stores.length} object store`,
        data: {db: db.name},
        leaf: noStores,
        children: storeNodes,
      };
    });
  }

  /** Lazy-load: alla prima espansione di un object store ne legge i record e ne crea i nodi. */
  async onNodeExpand(event: {node: TreeNode}): Promise<void> {
    const node = event?.node;
    const data = node?.data as {db?: string; store?: string} | undefined;
    if (node?.type !== 'store' || !data?.db || !data?.store) {
      return; // nodo database o non pertinente: niente da caricare
    }
    if (node.children && node.children.length) {
      return; // già caricato
    }
    this.idbLoading.set(true);
    try {
      const res = await this.indexedDbProbe.readStoreEntries(data.db, data.store, this.idbEntryLimit);
      node.children = this.buildRecordNodes(res);
      this.idbTreeNodes.update((nodes) => [...nodes]); // nuova ref top-level → re-render p-tree
    } finally {
      this.idbLoading.set(false);
    }
  }

  /** Trasforma i record letti in nodi `record` (più nodi `note` per store vuoto/troncato). */
  private buildRecordNodes(data: NecIdbStoreEntries): TreeNode[] {
    const nodes: TreeNode[] = data.entries.map((e): TreeNode => {
      const record: TreeNode = {label: e.key, type: 'record', leaf: !this.allowRevealValues};
      if (this.allowRevealValues) {
        // Il valore (mascherato) è un nodo figlio: si rivela espandendo il record.
        record.children = [{label: this.formatIdbValue(e.value), type: 'value', leaf: true, selectable: false}];
      }
      return record;
    });
    if (!data.entries.length) {
      nodes.push({label: data.note ?? 'store vuoto', type: 'note', leaf: true, selectable: false});
    } else if (data.note) {
      nodes.push({label: data.note, type: 'note', leaf: true, selectable: false});
    }
    if (data.truncated) {
      const of = data.total != null ? ` di ${data.total}` : '';
      nodes.push({
        label: `mostrati i primi ${data.entries.length}${of} record`,
        type: 'note',
        leaf: true,
        selectable: false,
      });
    }
    return nodes;
  }

  /** Serializza e maschera (privacy) il valore grezzo di un record IndexedDB per la UI. */
  formatIdbValue(value: unknown): string {
    let text: string;
    try {
      text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    } catch {
      text = String(value);
    }
    return maskValue('', text ?? 'undefined', 2000);
  }

  /** Step 1: chiede conferma per il `Reset` completo della slice. */
  requestReset(key: string): void {
    this.pendingResponsesKey.set(null);
    this.pendingResetAll.set(false);
    this.pendingResetKey.set(key);
  }

  /** Step 1: chiede conferma per il `ResetResponses` della slice. */
  requestResetResponses(key: string): void {
    this.pendingResetKey.set(null);
    this.pendingResetAll.set(false);
    this.pendingResponsesKey.set(key);
  }

  /** Step 1: chiede conferma per l'azzeramento globale di tutte le slice. */
  requestResetAll(): void {
    this.pendingResetKey.set(null);
    this.pendingResponsesKey.set(null);
    this.pendingResetAll.set(true);
  }

  /** Annulla qualsiasi conferma pendente (reset/responses/azzera-tutte). */
  cancelPending(): void {
    this.pendingResetKey.set(null);
    this.pendingResponsesKey.set(null);
    this.pendingResetAll.set(false);
  }

  /** Step 2: dispaccia il `Reset` della slice, emette `sliceReset` e ricarica i conteggi. */
  confirmReset(key: string): void {
    this.storeProbe.reset(key);
    this.sliceReset.emit(key);
    this.cancelPending();
    void this.refresh();
  }

  /** Step 2: dispaccia il `ResetResponses` della slice e ricarica i conteggi. */
  confirmResetResponses(key: string): void {
    this.storeProbe.resetResponses(key);
    this.cancelPending();
    void this.refresh();
  }

  /** Step 2: dispaccia il `Reset` su tutte le slice elencate, emettendo `sliceReset` per ciascuna. */
  confirmResetAll(): void {
    const slices = this.storeReport()?.slices ?? [];
    for (const s of slices) {
      this.storeProbe.reset(s.key);
      this.sliceReset.emit(s.key);
    }
    this.cancelPending();
    void this.refresh();
  }

  isSensitive(key: string): boolean {
    return looksSensitiveKey(key);
  }

  formatBytes(n: number | undefined | null): string {
    if (n == null) {
      return '–';
    }
    if (n < 1024) {
      return `${n} B`;
    }
    if (n < 1024 * 1024) {
      return `${(n / 1024).toFixed(1)} KB`;
    }
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  }
}
