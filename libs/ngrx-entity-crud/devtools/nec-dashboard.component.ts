import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {NecIdbReport, NecQuotaEstimate, NecStorageReport, NecStoreReport} from './models';
import {NecLocalStorageProbeService} from './probes/nec-local-storage-probe.service';
import {NecIndexedDbProbeService} from './probes/nec-indexeddb-probe.service';
import {NecStoreProbeService} from './probes/nec-store-probe.service';
import {looksSensitiveKey, maskValue} from './mask';

/**
 * `<nec-dashboard>` — dashboard di gestione progetto plug-and-play.
 *
 * Standalone, OnPush, template HTML inline (nessun PrimeNG → importabile ovunque). Tre
 * pannelli: localStorage, IndexedDB (agnostico), store NgRx + sezioni lazy. Per privacy
 * mostra SOLO chiavi/dimensioni/conteggi, mai i valori grezzi. Refresh manuale di default;
 * polling opt-in via `pollingMs`. Pensato per essere usabile anche in produzione.
 *
 * Il template usa le direttive strutturali classiche (`*ngIf`/`*ngFor` + `CommonModule`)
 * anziché il control-flow `@if`/`@for`: così il componente resta compatibile con Angular
 * >= 12 (la nuova sintassi alzerebbe il `minVersion` del pacchetto a 17).
 */
@Component({
  selector: 'nec-dashboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: system-ui, sans-serif;
        font-size: 13px;
        color: #1f2933;
      }
      .nec-toolbar {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
      }
      .nec-panel {
        border: 1px solid #d7dce2;
        border-radius: 6px;
        padding: 12px 16px;
        margin-bottom: 16px;
      }
      .nec-panel h3 {
        margin: 0 0 8px;
        font-size: 14px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        text-align: left;
        padding: 4px 8px;
        border-bottom: 1px solid #eceff3;
      }
      th {
        font-weight: 600;
        color: #52606d;
      }
      td.num,
      th.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .nec-note {
        color: #7b8794;
        font-style: italic;
      }
      .nec-badge {
        display: inline-block;
        padding: 1px 6px;
        border-radius: 10px;
        font-size: 11px;
        background: #e4e7eb;
      }
      .nec-badge.loading {
        background: #fde68a;
      }
      .nec-badge.error {
        background: #fca5a5;
      }
      .nec-badge.lazy {
        background: #bfdbfe;
      }
      button {
        cursor: pointer;
      }
    `,
  ],
  template: `
    <div class="nec-toolbar">
      <button type="button" (click)="refresh()" [disabled]="busy()">
        {{ busy() ? 'Aggiorno…' : 'Aggiorna' }}
      </button>
      <span class="nec-note" *ngIf="lastUpdated()">ultimo aggiornamento: {{ lastUpdated() }}</span>
    </div>

    <!-- Quota aggregata origine -->
    <div class="nec-panel">
      <h3>Quota origine (aggregata)</h3>
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
    </div>

    <!-- localStorage -->
    <div class="nec-panel">
      <h3>localStorage</h3>
      <ng-container *ngIf="storage()?.available; else noLocalStorage">
        <div>
          {{ storage()?.count }} chiavi · totale
          <strong>{{ formatBytes(storage()?.totalBytesUtf16) }}</strong> (UTF-16) /
          {{ formatBytes(storage()?.totalBytesUtf8) }} (UTF-8)
        </div>
        <ng-container *ngIf="storage()!.entries.length; else noLocalStorageEntries">
          <table>
            <thead>
              <tr>
                <th>chiave</th>
                <th class="num">UTF-16</th>
                <th class="num">UTF-8</th>
                <th *ngIf="allowRevealValues">valore</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of storage()!.entries; trackBy: trackByKey">
                <td>
                  {{ e.key }}
                  <span
                    class="nec-badge error"
                    title="chiave potenzialmente sensibile"
                    *ngIf="isSensitive(e.key)"
                  >⚠</span>
                </td>
                <td class="num">{{ formatBytes(e.bytesUtf16) }}</td>
                <td class="num">{{ formatBytes(e.bytesUtf8) }}</td>
                <td *ngIf="allowRevealValues">
                  <ng-container *ngIf="revealed()[e.key] !== undefined; else revealBtn">
                    <code>{{ revealed()[e.key] }}</code>
                  </ng-container>
                  <ng-template #revealBtn>
                    <button type="button" (click)="reveal(e.key)">mostra</button>
                  </ng-template>
                </td>
              </tr>
            </tbody>
          </table>
        </ng-container>
        <ng-template #noLocalStorageEntries>
          <div class="nec-note">Nessuna chiave.</div>
        </ng-template>
      </ng-container>
      <ng-template #noLocalStorage>
        <div class="nec-note">localStorage non disponibile.</div>
      </ng-template>
    </div>

    <!-- IndexedDB -->
    <div class="nec-panel">
      <h3>IndexedDB</h3>
      <ng-container *ngIf="idb()?.available; else noIdb">
        <div class="nec-note">adapter: {{ idb()?.adapter }}</div>
        <div class="nec-note" *ngIf="idb()?.note">{{ idb()?.note }}</div>
        <table *ngIf="idb()!.databases.length">
          <thead>
            <tr>
              <th>database</th>
              <th>object store</th>
              <th class="num">record</th>
            </tr>
          </thead>
          <tbody>
            <ng-container *ngFor="let db of idb()!.databases; trackBy: trackByName">
              <ng-container *ngIf="db.stores.length; else noStores">
                <tr *ngFor="let st of db.stores; trackBy: trackByName">
                  <td>{{ db.name }} <span class="nec-note">v{{ db.version }}</span></td>
                  <td>{{ st.name }}</td>
                  <td class="num">{{ st.count ?? '–' }}</td>
                </tr>
              </ng-container>
              <ng-template #noStores>
                <tr>
                  <td>{{ db.name }} <span class="nec-note">v{{ db.version }}</span></td>
                  <td class="nec-note" colspan="2">{{ db.note ?? 'nessun object store' }}</td>
                </tr>
              </ng-template>
            </ng-container>
          </tbody>
        </table>
        <div class="nec-note">I byte per record/store non sono misurabili: si mostra solo il conteggio.</div>
      </ng-container>
      <ng-template #noIdb>
        <div class="nec-note">IndexedDB non disponibile in questo contesto.</div>
      </ng-template>
    </div>

    <!-- Store NgRx + lazy -->
    <div class="nec-panel">
      <h3>Store NgRx</h3>
      <ng-container *ngIf="storeReport()">
        <ng-container *ngIf="storeReport()!.slices.length; else noSlices">
          <table>
            <thead>
              <tr>
                <th>slice</th>
                <th>tipo</th>
                <th class="num">entità</th>
                <th class="num">responses</th>
                <th>stato</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of storeReport()!.slices; trackBy: trackByKey">
                <td>{{ s.key }}</td>
                <td>{{ s.kind }}</td>
                <td class="num">{{ s.entityCount ?? '–' }}</td>
                <td class="num">{{ s.responsesCount }}</td>
                <td>
                  <span class="nec-badge loading" *ngIf="s.isLoading">loading</span>
                  <span class="nec-badge error" [title]="s.error" *ngIf="s.error">error</span>
                  <span class="nec-badge" *ngIf="!s.isLoading && !s.error">{{
                    s.isLoaded ? 'caricato' : 'idle'
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </ng-container>
        <ng-template #noSlices>
          <div class="nec-note">Nessuna slice CRUD montata.</div>
        </ng-template>

        <ng-container *ngIf="storeReport()!.lazy?.length; else noLazy">
          <h3 style="margin-top:12px">Sezioni lazy (da lazy-report)</h3>
          <div class="nec-note" *ngIf="storeReport()!.lazyReportGeneratedAt">
            snapshot generato il {{ storeReport()!.lazyReportGeneratedAt }} — rigenera con
            <code>ng generate ngrx-entity-crud:lazy-report --format=json</code> se obsoleto.
          </div>
          <table>
            <thead>
              <tr>
                <th>store</th>
                <th>sezioni</th>
                <th>verdetto</th>
                <th>runtime</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let l of storeReport()!.lazy!; trackBy: trackByName">
                <td>{{ l.name }}</td>
                <td>{{ l.sections.join(', ') || '–' }}</td>
                <td>{{ l.verdict }}</td>
                <td>
                  <span
                    class="nec-badge"
                    [class.lazy]="l.runtimeStatus === 'lazy-not-loaded'"
                  >{{ l.runtimeStatus }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </ng-container>
        <ng-template #noLazy>
          <div class="nec-note">
            Nessun lazy-report caricato (genera src/assets/lazy-report.json con
            <code>ng generate ngrx-entity-crud:lazy-report --format=json</code>).
          </div>
        </ng-template>
      </ng-container>
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
  /** Abilita il reveal opt-in dei valori localStorage (sempre mascherati). Default: false. */
  @Input() allowRevealValues = false;

  readonly busy = signal(false);
  readonly lastUpdated = signal<string | null>(null);
  readonly storage = signal<NecStorageReport | null>(null);
  readonly quota = signal<NecQuotaEstimate | null>(null);
  readonly idb = signal<NecIdbReport | null>(null);
  readonly storeReport = signal<NecStoreReport | null>(null);
  readonly revealed = signal<Record<string, string>>({});

  private timer: ReturnType<typeof setInterval> | null = null;

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
      return;
    }
    this.busy.set(true);
    this.revealed.set({}); // i valori rivelati non sopravvivono a un refresh
    try {
      this.storage.set(this.localStorageProbe.read('local'));
      this.quota.set(await this.localStorageProbe.estimate());
      this.idb.set(await this.indexedDbProbe.read(this.idbDatabaseNames));

      const opts = {blacklist: this.blacklist, whitelist: this.whitelist};
      if (this.lazyReportUrl) {
        this.storeReport.set(await this.storeProbe.readWithLazyReport(this.lazyReportUrl, opts));
      } else {
        this.storeReport.set(this.storeProbe.read(opts));
      }
      this.lastUpdated.set(new Date().toLocaleTimeString());
    } finally {
      this.busy.set(false);
    }
  }

  /** Reveal opt-in di un valore localStorage, sempre passato per `maskValue` (privacy). */
  reveal(key: string): void {
    const value = this.localStorageProbe.readValue(key) ?? '';
    this.revealed.update((m) => ({...m, [key]: maskValue(key, value)}));
  }

  isSensitive(key: string): boolean {
    return looksSensitiveKey(key);
  }

  /** trackBy per le righe identificate da `key` (entry localStorage, slice store). */
  trackByKey(_: number, item: {key: string}): string {
    return item.key;
  }

  /** trackBy per le righe identificate da `name` (DB/object store IndexedDB, voci lazy). */
  trackByName(_: number, item: {name: string}): string {
    return item.name;
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
