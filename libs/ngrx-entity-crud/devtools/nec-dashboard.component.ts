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
import {DividerModule} from 'primeng/divider';
import {ProgressBarModule} from 'primeng/progressbar';
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
 * Marcatori del blocco variabili nello snippet Python: ricopiando SOLO il blocco ("Copia solo
 * variabili") si sostituiscono i valori scaduti (es. token) senza toccare il resto dello script.
 */
const PY_VARS_BEGIN = '# --- nec-dashboard: inizio variabili ---';
const PY_VARS_END = '# --- nec-dashboard: fine variabili ---';

/**
 * `<nec-dashboard>` — dashboard di gestione progetto plug-and-play.
 *
 * Standalone, OnPush, costruita sui componenti **PrimeNG** (`p-card`, `p-table`, `p-tag`,
 * `p-tree`, `p-divider`, `p-progressBar`, direttiva `pButton`): richiede quindi
 * `primeng` + `primeicons` nell'app consumer (peerDependencies opzionali del solo entry-point
 * `devtools`). Toolbar sticky con refresh, "Copia report" (snapshot JSON dei soli metadati,
 * per issue/supporto) e pausa/riprendi del polling. Quattro pannelli: quota origine (progress
 * bar + dettaglio `usageDetails` su Chromium) e localStorage affiancati in griglia responsive,
 * IndexedDB (agnostico, con `p-tree` espandibile e lazy-load dei record), store NgRx + sezioni
 * lazy (contatori, riepilogo errori e "Azzera tutte" DENTRO il pannello, perché agisce solo
 * sulle slice; tabelle ordinabili). Per privacy mostra di default SOLO chiavi/dimensioni/
 * conteggi; i valori (localStorage e record IndexedDB) sono rivelabili solo con
 * `allowRevealValues` e comunque mascherati. Unica eccezione, con opt-in dedicato: lo snippet
 * Python (`pythonSnippetKeys`) copia negli appunti i valori IN CHIARO delle sole chiavi
 * elencate — servono per invocare le API da script — senza mai mostrarli a schermo. Refresh
 * manuale di default; polling opt-in via `pollingMs`. Usabile anche in produzione.
 *
 * Tutta la UI è a componenti PrimeNG, con uno stile uniforme: pulsanti sempre `pButton` +
 * `p-button-sm` con icona — pieni per l'azione primaria del contesto (Aggiorna, Azzera tutte,
 * conferma "Sì"), `p-button-outlined` per le azioni secondarie e di riga; severity `danger`
 * per le distruttive, `secondary` per le neutre. Stati vuoti/non disponibili ed errori usano
 * il box `.nec-message` (stilato con le variabili del tema), marcatori con `p-tag`,
 * intestazioni di sezione con `p-divider`; i colori vengono dalle CSS variable del tema
 * PrimeNG (con fallback), così la dashboard eredita il tema dell'app.
 * Le **classi** severity (`p-button-danger`, `-outlined`, `-sm`) sono l'idioma compatibile
 * sia con PrimeNG 16 (target dell'app consumer) sia con le major successive.
 *
 * VINCOLO di compatibilità: ng-packagr (Ivy partial) embedda nel bundle i riferimenti alle
 * CLASSI dei componenti PrimeNG usati nel template; sono quindi ammessi solo componenti il
 * cui nome di classe è identico da PrimeNG 16 a 19. NIENTE `p-message`: la classe è
 * `UIMessage` in v16 e `Message` in v17+, e romperebbe una delle due major (è il motivo del
 * box `.nec-message`). Prima di adottare un nuovo modulo PrimeNG, verificare il nome della
 * classe nel `.d.ts` di entrambe le versioni (es. `npm pack primeng@16`).
 * Il template usa le direttive strutturali classiche (`*ngIf`/`*ngFor`) anziché il
 * control-flow `@if`/`@for`, per restare compatibile con Angular 16+.
 */
@Component({
  selector: 'nec-dashboard',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, DividerModule, ProgressBarModule, TableModule, TagModule, TreeModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font-family, var(--p-font-family, system-ui, sans-serif));
        font-size: 13px;
        color: var(--text-color, var(--p-text-color, #1f2933));
      }
      .nec-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .nec-toolbar {
        position: sticky;
        top: 0;
        z-index: 5;
        background: var(--surface-card, var(--p-content-background, #ffffff));
        padding: 4px 0;
      }
      .nec-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
        gap: 16px;
        align-items: start;
      }
      .nec-spacer {
        margin-left: auto;
      }
      .nec-actions {
        min-width: 340px;
      }
      .nec-errors {
        display: flex;
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
      }
      /* Inline message "a tema" senza p-message: UIMessage (v16) vs Message (v17+) rende
         il componente inutilizzabile su tutto il range supportato (vedi doc in testata). */
      .nec-message {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid transparent;
        border-radius: 6px;
      }
      .nec-message-info {
        background: var(--blue-50, var(--p-blue-50, #eff6ff));
        border-color: var(--blue-200, var(--p-blue-200, #bfdbfe));
        color: var(--blue-900, var(--p-blue-900, #1e3a8a));
      }
      .nec-message-warn {
        background: var(--yellow-50, var(--p-yellow-50, #fefce8));
        border-color: var(--yellow-200, var(--p-yellow-200, #fef08a));
        color: var(--yellow-900, var(--p-yellow-900, #713f12));
      }
      .nec-message-error {
        background: var(--red-50, var(--p-red-50, #fef2f2));
        border-color: var(--red-200, var(--p-red-200, #fecaca));
        color: var(--red-900, var(--p-red-900, #7f1d1d));
      }
      .nec-mb {
        margin-bottom: 16px;
      }
      .nec-note {
        color: var(--text-color-secondary, var(--p-text-muted-color, #7b8794));
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
        background: var(--surface-100, var(--p-surface-100, #f5f7fa));
        border: 1px solid var(--surface-border, var(--p-content-border-color, #eceff3));
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
    <div class="nec-row nec-toolbar nec-mb">
      <button
        type="button"
        pButton
        class="p-button-sm"
        icon="pi pi-refresh"
        [label]="busy() ? 'Aggiorno…' : 'Aggiorna'"
        [disabled]="busy()"
        (click)="refresh()"
      ></button>
      <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
              icon="pi pi-copy" [label]="copied() ? 'Copiato' : 'Copia report'"
              aria-label="Copia il report diagnostico (solo metadati) negli appunti"
              (click)="copyReport()"></button>
      <ng-container *ngIf="pollingMs > 0">
        <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
                [icon]="paused() ? 'pi pi-play' : 'pi pi-pause'"
                [label]="paused() ? 'Riprendi' : 'Pausa'"
                aria-label="Sospende o riprende l'auto-refresh" (click)="togglePaused()"></button>
        <p-tag severity="info"
               [value]="paused() ? 'auto-refresh in pausa' : 'auto-refresh ' + pollingMs / 1000 + 's'"></p-tag>
      </ng-container>
      <span class="nec-note" *ngIf="lastUpdated()">ultimo aggiornamento: {{ lastUpdated() }}</span>
    </div>

    <!-- Quota aggregata origine + localStorage, affiancati sui viewport larghi -->
    <div class="nec-grid nec-mb">
      <p-card header="Quota origine (aggregata)">
        <ng-container *ngIf="quota()?.available; else noQuota">
          <div class="nec-mb">
            uso: <strong>{{ formatBytes(quota()?.usage) }}</strong> /
            quota: <strong>{{ formatBytes(quota()?.quota) }}</strong>
          </div>
          <p-progressBar *ngIf="quotaPercent() !== null" styleClass="nec-mb"
                         [value]="quotaPercent()!" [showValue]="true"></p-progressBar>
          <p-table *ngIf="usageDetailEntries().length"
                   [value]="usageDetailEntries()" styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th>area</th>
                <th class="nec-num">uso</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-d>
              <tr>
                <td>{{ d.key }}</td>
                <td class="nec-num">{{ formatBytes(d.value) }}</td>
              </tr>
            </ng-template>
          </p-table>
          <div class="nec-note" *ngIf="!usageDetailEntries().length">
            Stima per-origine: include localStorage + IndexedDB + Cache, non scorporabile.
          </div>
          <div class="nec-note" *ngIf="usageDetailEntries().length">
            Stima per-origine con dettaglio per area (usageDetails, solo Chromium).
          </div>
        </ng-container>
        <ng-template #noQuota>
          <div class="nec-message nec-message-warn">
            <i class="pi pi-exclamation-triangle"></i>Stima quota non disponibile (Safari o contesto non sicuro).
          </div>
        </ng-template>
      </p-card>

      <p-card header="localStorage">
        <ng-container *ngIf="storage()?.available; else noLocalStorage">
          <div class="nec-mb">
            {{ storage()?.count }} chiavi · totale
            <strong>{{ formatBytes(storage()?.totalBytesUtf16) }}</strong> (UTF-16) /
            {{ formatBytes(storage()?.totalBytesUtf8) }} (UTF-8)
          </div>
          <div class="nec-row nec-mb" *ngIf="pythonSnippetKeys.length">
            <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
                    icon="pi pi-code" [label]="copiedPython() === 'snippet' ? 'Copiato' : 'Copia snippet Python'"
                    aria-label="Copia negli appunti lo snippet Python completo (variabili + esempio requests)"
                    (click)="copyPythonSnippet()"></button>
            <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
                    icon="pi pi-copy" [label]="copiedPython() === 'vars' ? 'Copiato' : 'Copia solo variabili'"
                    aria-label="Copia negli appunti il solo blocco variabili aggiornato"
                    (click)="copyPythonVariables()"></button>
            <span class="nec-note">negli appunti i valori vanno in chiaro (a schermo restano nascosti)</span>
          </div>
          <p-table *ngIf="storage()!.entries.length; else noLocalStorageEntries"
                   [value]="storage()!.entries" sortField="bytesUtf16" [sortOrder]="-1"
                   styleClass="p-datatable-sm">
            <ng-template pTemplate="header">
              <tr>
                <th pSortableColumn="key">chiave <p-sortIcon field="key"></p-sortIcon></th>
                <th class="nec-num" pSortableColumn="bytesUtf16">UTF-16 <p-sortIcon field="bytesUtf16"></p-sortIcon></th>
                <th class="nec-num" pSortableColumn="bytesUtf8">UTF-8 <p-sortIcon field="bytesUtf8"></p-sortIcon></th>
                <th *ngIf="allowRevealValues">valore</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-e>
              <tr>
                <td>
                  {{ e.key }}
                  <p-tag styleClass="nec-ml" severity="danger" icon="pi pi-exclamation-triangle"
                         value="sensibile" *ngIf="isSensitive(e.key)"></p-tag>
                </td>
                <td class="nec-num">{{ formatBytes(e.bytesUtf16) }}</td>
                <td class="nec-num">{{ formatBytes(e.bytesUtf8) }}</td>
                <td *ngIf="allowRevealValues">
                  <ng-container *ngIf="revealed()[e.key] !== undefined; else revealBtn">
                    <code>{{ revealed()[e.key] }}</code>
                  </ng-container>
                  <ng-template #revealBtn>
                    <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm" icon="pi pi-eye" label="mostra"
                            (click)="reveal(e.key)"></button>
                  </ng-template>
                </td>
              </tr>
            </ng-template>
          </p-table>
          <ng-template #noLocalStorageEntries>
            <div class="nec-message nec-message-info"><i class="pi pi-info-circle"></i>Nessuna chiave.</div>
          </ng-template>
        </ng-container>
        <ng-template #noLocalStorage>
          <div class="nec-message nec-message-warn">
            <i class="pi pi-exclamation-triangle"></i>localStorage non disponibile.
          </div>
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
            <div class="nec-message nec-message-info"><i class="pi pi-info-circle"></i>Nessun database elencabile.</div>
          </ng-template>
          <div class="nec-note" *ngIf="!allowRevealValues">
            I valori dei record sono nascosti: imposta <code>[allowRevealValues]="true"</code> per
            espandere ogni record e vederne il contenuto (mascherato).
          </div>
        </ng-container>
        <ng-template #noIdb>
          <div class="nec-message nec-message-warn">
            <i class="pi pi-exclamation-triangle"></i>IndexedDB non disponibile in questo contesto.
          </div>
        </ng-template>
      </p-card>
    </div>

    <!-- Store NgRx + lazy -->
    <div class="nec-mb">
      <p-card header="Store NgRx">
        <ng-container *ngIf="storeReport()">
          <ng-container *ngIf="storeReport()!.slices.length; else noSlices">
            <div class="nec-row nec-mb">
              <p-tag severity="info" [value]="storeReport()!.slices.length + ' slice'"></p-tag>
              <p-tag severity="success" *ngIf="withDataCount()"
                     [value]="withDataCount() + ' con dati'"></p-tag>
              <p-tag severity="info" *ngIf="storeReport()!.loadingNames.length"
                     [value]="storeReport()!.loadingNames.length + ' in loading'"></p-tag>
              <p-tag severity="danger" *ngIf="storeReport()!.errors.length"
                     [value]="storeReport()!.errors.length + ' in errore'"></p-tag>
              <!-- L'azione distruttiva sta a destra, lontana dai contatori (evita i misclick). -->
              <div class="nec-row nec-spacer">
                <ng-container *ngIf="pendingResetAll(); else resetAllBtn">
                  <span class="nec-note" role="alert">azzerare tutte le slice?</span>
                  <button type="button" pButton class="p-button-danger p-button-sm" icon="pi pi-check" label="Sì"
                          aria-label="Conferma azzeramento di tutte le slice" (click)="confirmResetAll()"></button>
                  <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm" icon="pi pi-times" label="Annulla"
                          aria-label="Annulla azzeramento" (click)="cancelPending()"></button>
                </ng-container>
                <ng-template #resetAllBtn>
                  <button type="button" pButton class="p-button-danger p-button-sm" icon="pi pi-trash"
                          label="Azzera tutte" (click)="requestResetAll()"></button>
                </ng-template>
              </div>
            </div>
            <div class="nec-errors nec-mb" *ngIf="storeReport()!.errors.length">
              <div class="nec-message nec-message-error" *ngFor="let err of storeReport()!.errors">
                <i class="pi pi-times-circle"></i>{{ err }}
              </div>
            </div>
            <div class="nec-row nec-mb">
              <button
                type="button"
                pButton
                class="p-button-sm"
                [class.p-button-outlined]="!onlyWithData()"
                [icon]="onlyWithData() ? 'pi pi-filter-slash' : 'pi pi-filter'"
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
                  <th pSortableColumn="key">slice <p-sortIcon field="key"></p-sortIcon></th>
                  <th pSortableColumn="kind">tipo <p-sortIcon field="kind"></p-sortIcon></th>
                  <th class="nec-num" pSortableColumn="entityCount">entità <p-sortIcon field="entityCount"></p-sortIcon></th>
                  <th class="nec-num" pSortableColumn="responsesCount">responses <p-sortIcon field="responsesCount"></p-sortIcon></th>
                  <th>stato</th>
                  <th class="nec-actions">azioni</th>
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
                  <td class="nec-actions">
                    <div class="nec-row">
                      <ng-container *ngIf="pendingResetKey() === s.key">
                        <span class="nec-note" role="alert">azzerare la slice?</span>
                        <button type="button" pButton class="p-button-danger p-button-sm" icon="pi pi-check" label="Sì"
                                [attr.aria-label]="'Conferma azzeramento della slice ' + s.key"
                                (click)="confirmReset(s.key)"></button>
                        <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm" icon="pi pi-times" label="Annulla"
                                aria-label="Annulla azzeramento" (click)="cancelPending()"></button>
                      </ng-container>
                      <ng-container *ngIf="pendingResponsesKey() === s.key">
                        <span class="nec-note" role="alert">azzerare le responses?</span>
                        <button type="button" pButton class="p-button-danger p-button-sm" icon="pi pi-check" label="Sì"
                                [attr.aria-label]="'Conferma azzeramento delle responses di ' + s.key"
                                (click)="confirmResetResponses(s.key)"></button>
                        <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm" icon="pi pi-times" label="Annulla"
                                aria-label="Annulla azzeramento" (click)="cancelPending()"></button>
                      </ng-container>
                      <ng-container *ngIf="pendingResetKey() !== s.key && pendingResponsesKey() !== s.key">
                        <button type="button" pButton class="p-button-danger p-button-outlined p-button-sm"
                                icon="pi pi-trash" label="reset"
                                [attr.aria-label]="'Azzera la slice ' + s.key" (click)="requestReset(s.key)"></button>
                        <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm" icon="pi pi-eraser" label="reset responses"
                                [attr.aria-label]="'Azzera le responses di ' + s.key"
                                (click)="requestResetResponses(s.key)"></button>
                      </ng-container>
                    </div>
                  </td>
                </tr>
              </ng-template>
            </p-table>
            <ng-template #noDataSlices>
              <div class="nec-message nec-message-info">
                <i class="pi pi-info-circle"></i>Nessuna slice con dati caricati.
              </div>
            </ng-template>
          </ng-container>
          <ng-template #noSlices>
            <div class="nec-message nec-message-info"><i class="pi pi-info-circle"></i>Nessuna slice CRUD montata.</div>
          </ng-template>

          <ng-container *ngIf="storeReport()!.lazy?.length; else noLazy">
            <p-divider align="left"><b>Sezioni lazy (da lazy-report)</b></p-divider>
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
            <div class="nec-message nec-message-info">
              <i class="pi pi-info-circle"></i>Nessun lazy-report caricato: genera
              src/assets/lazy-report.json con «ng generate ngrx-entity-crud:lazy-report --format=json».
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
  /** Intervallo di auto-refresh in ms; 0 = solo manuale (default). Sospendibile dalla toolbar. */
  @Input() pollingMs = 0;
  /** Abilita il reveal opt-in dei valori localStorage e dei record IndexedDB (sempre mascherati). Default: false. */
  @Input() allowRevealValues = false;
  /** Numero massimo di record letti per object store nella vista ad albero IndexedDB. Default: 50. */
  @Input() idbEntryLimit = 50;
  /**
   * Opt-in dello snippet Python nel pannello localStorage: chiavi da esportare come variabili
   * (es. `['access_token']`). Vuoto (default) = pulsanti nascosti. ATTENZIONE: la copia mette
   * negli appunti i valori IN CHIARO di queste sole chiavi (servono per invocare le API da
   * script); a schermo non vengono comunque mai mostrati.
   */
  @Input() pythonSnippetKeys: string[] = [];
  /** Base URL delle API usata nello snippet Python; default: `location.origin`. */
  @Input() apiBaseUrl: string | null = null;

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
  /** `true` mentre l'auto-refresh è sospeso dal pulsante Pausa (il timer resta attivo). */
  readonly paused = signal(false);
  /** Feedback transitorio del pulsante "Copia report" (label "Copiato" per 2s). */
  readonly copied = signal(false);
  /** Feedback transitorio dei pulsanti dello snippet Python (quale copia è appena riuscita). */
  readonly copiedPython = signal<'snippet' | 'vars' | null>(null);

  /** `true` per mostrare solo le slice che contengono dati (filtro del pannello Store NgRx). */
  readonly onlyWithData = signal(false);
  /** Slice visibili in base al filtro `onlyWithData`. */
  readonly visibleSlices = computed(() => {
    const all = this.storeReport()?.slices ?? [];
    return this.onlyWithData() ? all.filter((s) => s.hasData) : all;
  });
  /** Numero di slice con dati (contatore in testa al pannello Store NgRx). */
  readonly withDataCount = computed(
    () => (this.storeReport()?.slices ?? []).filter((s) => s.hasData).length
  );
  /** Percentuale di quota origine usata (0–100, arrotondata); `null` se non stimabile. */
  readonly quotaPercent = computed(() => {
    const q = this.quota();
    if (!q?.available || !q.quota || q.usage == null) {
      return null;
    }
    return Math.round((q.usage / q.quota) * 100);
  });
  /** Voci `usageDetails` (breakdown per area, solo Chromium) ordinate per uso decrescente. */
  readonly usageDetailEntries = computed(() => {
    const details = this.quota()?.usageDetails ?? {};
    return Object.entries(details)
      .map(([key, value]) => ({key, value}))
      .sort((a, b) => b.value - a.value);
  });

  /** Nodi `p-tree` della vista IndexedDB (DB → object store; i record sono lazy-load). */
  readonly idbTreeNodes = signal<TreeNode[]>([]);
  /** `true` mentre `p-tree` sta caricando i record di un object store espanso. */
  readonly idbLoading = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;
  private copiedTimer: ReturnType<typeof setTimeout> | null = null;
  private copiedPythonTimer: ReturnType<typeof setTimeout> | null = null;
  /** Un refresh richiesto mentre un altro è già in corso: viene ri-eseguito al termine. */
  private pendingRefresh = false;

  ngOnInit(): void {
    void this.refresh();
    if (this.pollingMs > 0) {
      this.timer = setInterval(() => {
        if (!this.paused()) {
          void this.refresh();
        }
      }, this.pollingMs);
    }
  }

  ngOnDestroy(): void {
    if (this.timer != null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.copiedTimer != null) {
      clearTimeout(this.copiedTimer);
      this.copiedTimer = null;
    }
    if (this.copiedPythonTimer != null) {
      clearTimeout(this.copiedPythonTimer);
      this.copiedPythonTimer = null;
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

  // --- Toolbar: polling e report diagnostico -------------------------------------------------

  /** Sospende/riprende l'auto-refresh (solo con `pollingMs > 0`; il timer non viene ricreato). */
  togglePaused(): void {
    this.paused.update((v) => !v);
  }

  /**
   * Report diagnostico JSON con i soli metadati già visibili in dashboard (chiavi, dimensioni,
   * conteggi): niente valori, quindi incollabile in una issue senza rischi di privacy.
   */
  diagnosticReport(): string {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        quota: this.quota(),
        localStorage: this.storage(),
        indexedDb: this.idb(),
        store: this.storeReport(),
      },
      null,
      2
    );
  }

  /** Copia il report diagnostico negli appunti e mostra "Copiato" per 2s. */
  async copyReport(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.diagnosticReport());
    } catch {
      return; // appunti non disponibili (permessi/contesto non sicuro): nessun feedback
    }
    this.copied.set(true);
    if (this.copiedTimer != null) {
      clearTimeout(this.copiedTimer);
    }
    this.copiedTimer = setTimeout(() => this.copied.set(false), 2000);
  }

  // --- Snippet Python (pannello localStorage) -----------------------------------------------

  /** Nome variabile Python derivato dalla chiave localStorage (`access_token` → `ACCESS_TOKEN`). */
  private toPythonName(key: string): string {
    const name = key
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();
    return /^[0-9]/.test(name) ? `_${name}` : name || 'VALUE';
  }

  /** Literal stringa Python: l'escaping JSON è un sottoinsieme valido dei literal Python 3. */
  private toPythonString(value: string): string {
    return JSON.stringify(value);
  }

  /**
   * Blocco variabili Python delimitato dai marcatori, coi valori localStorage ATTUALI in
   * chiaro: quando il token scade basta ricopiarlo e incollarlo sopra il blocco vecchio.
   */
  pythonVariablesBlock(): string {
    const baseUrl = this.apiBaseUrl ?? (typeof location === 'undefined' ? '' : location.origin);
    const lines = [
      PY_VARS_BEGIN,
      `# generato dalla nec-dashboard il ${new Date().toISOString()}`,
      `BASE_URL = ${this.toPythonString(baseUrl)}`,
    ];
    for (const key of this.pythonSnippetKeys) {
      const value = this.localStorageProbe.readValue(key);
      const name = this.toPythonName(key);
      lines.push(
        value == null
          ? `${name} = ""  # chiave ${this.toPythonString(key)} assente in localStorage`
          : `${name} = ${this.toPythonString(value)}  # localStorage[${this.toPythonString(key)}]`
      );
    }
    lines.push(PY_VARS_END);
    return lines.join('\n');
  }

  /** Snippet Python completo: blocco variabili + esempio `requests` pronto da adattare. */
  pythonSnippet(): string {
    const authVar = this.pythonSnippetKeys.length
      ? this.toPythonName(this.pythonSnippetKeys[0])
      : 'ACCESS_TOKEN';
    return [
      this.pythonVariablesBlock(),
      '',
      'import requests',
      '',
      'session = requests.Session()',
      `session.headers["Authorization"] = f"Bearer {${authVar}}"  # adatta lo schema se serve`,
      '',
      'resp = session.get(f"{BASE_URL}/api/resource")',
      'resp.raise_for_status()',
      'print(resp.json())',
      '',
    ].join('\n');
  }

  /** Copia negli appunti lo snippet Python completo (variabili + esempio `requests`). */
  async copyPythonSnippet(): Promise<void> {
    await this.copyPython(this.pythonSnippet(), 'snippet');
  }

  /** Copia negli appunti il solo blocco variabili, rigenerato coi valori correnti. */
  async copyPythonVariables(): Promise<void> {
    await this.copyPython(this.pythonVariablesBlock(), 'vars');
  }

  private async copyPython(text: string, kind: 'snippet' | 'vars'): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // appunti non disponibili (permessi/contesto non sicuro): nessun feedback
    }
    this.copiedPython.set(kind);
    if (this.copiedPythonTimer != null) {
      clearTimeout(this.copiedPythonTimer);
    }
    this.copiedPythonTimer = setTimeout(() => this.copiedPython.set(null), 2000);
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
