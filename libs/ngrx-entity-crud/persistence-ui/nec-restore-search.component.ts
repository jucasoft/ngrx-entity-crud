import {ChangeDetectionStrategy, Component, Input, isDevMode, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {Store} from '@ngrx/store';
import {Actions as NgrxActions, ofType} from '@ngrx/effects';
import {BehaviorSubject, combineLatest, from, merge, Observable, of, Subject} from 'rxjs';
import {map, startWith, takeUntil} from 'rxjs/operators';
import {Actions} from 'ngrx-entity-crud';
import {
  createSetSectionSaveModeAction,
  NecPersistence,
  NecPersistenceActions,
  NecPersistenceSelectors,
  NecPersistenceService,
  NecSaveMode,
  NecSectionCheck,
  NecSectionStats,
} from 'ngrx-entity-crud/persistence';

export type NecRestoreSearchState = 'none' | 'prompt' | 'auto-restoring' | 'manual-restoring';

export interface NecRestoreSearchViewModel {
  state: NecRestoreSearchState;
  stats: NecSectionStats | null;
  restoreError: string | null;
  pendingWrites: number;
  quotaWarning: boolean;
  saveMode: NecSaveMode;
  /** `false`: persistenza spenta per la sezione, il componente mostra solo il contenuto proiettato. */
  enabled: boolean;
}

/** Quello che serve al componente, ricavato da `[persistence]` o dagli input singoli (beta precedenti). */
interface NecResolvedSection<T> {
  enabled: boolean;
  selectors: NecPersistenceSelectors;
  crudActions: Actions<T>;
  setSaveMode: NecPersistenceActions['SetSectionSaveMode'];
}

/** `340 KB`, `1.2 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** `today 18:42`, `yesterday 18:42`, o la data assoluta oltre le 48 ore. */
export function formatAge(at: number, now: number = Date.now()): string {
  const date = new Date(at);
  const today = new Date(now);
  const time = date.toLocaleTimeString(undefined, {hour: '2-digit', minute: '2-digit'});
  if (isSameDay(date, today)) {
    return `today ${time}`;
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `yesterday ${time}`;
  }
  return `${date.toLocaleDateString()} ${time}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/**
 * `<nec-restore-search>` — wrappa il pulsante Search di una sezione con lo stato della
 * persistenza locale (vedi `ngrx-entity-crud-persistence-plan.md`).
 *
 * Cinque stati (decisione 9 del piano, componente PrimeNG pronto):
 * 1. **none** — nessun dato locale, o l'utente ha scelto "New search": mostra il contenuto
 *    proiettato (`<ng-content>`, il normale pulsante Search dell'app, non gestito da questo
 *    componente — costruirne i criteri è compito del form, fuori scopo qui).
 * 2. **auto-restoring** — `autoRestore` configurato e i dati locali rientrano nella soglia:
 *    spinner, nessuna conferma richiesta.
 * 3. **prompt** — dati locali presenti fuori soglia (o `autoRestore` non configurato): riepilogo
 *    (risultati salvati, modifiche non inviate, dimensione, età) con `Restore` / `New search`
 *    (quest'ultimo con conferma inline stile Yes/Cancel, perché butta via lavoro non inviato).
 * 4. **manual-restoring** — spinner sul pulsante `Restore` durante `isLoading` della slice.
 * 5. **overlay quota/sync** — non uno stato a sé ma due indicatori mostrati insieme a uno
 *    qualsiasi degli stati sopra: icona di sync quando `pendingWrites$ > 0`, avviso quando
 *    `navigator.storage.estimate()` segnala quota quasi esaurita.
 *
 * La scelta tra gli stati 1-3 è già decisa alla creazione della sezione: legge lo stato scritto da
 * `createPersistenceReducer` tramite il selector `sectionCheck` di `createPersistenceSelectors`
 * (`@Input() selectors`), non ripete la query `stats(feature)`.
 *
 * Solo `p-button` e `p-tag` (classi identiche PrimeNG v16↔v19, `p-message` escluso). Il tipo
 * `severity` di `p-tag` è comunque `string`-based in entrambe le major: un valore come `warn`
 * al più degrada a un tag senza colore su una versione che non lo riconosce, non rompe nulla.
 */
@Component({
  selector: 'nec-restore-search',
  standalone: true,
  imports: [CommonModule, ButtonModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: inline-flex;
      }
      .nec-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
      }
      .nec-note {
        color: var(--text-color-secondary, var(--p-text-muted-color, #7b8794));
        font-style: italic;
      }
      .nec-ml {
        margin-left: 6px;
      }
    `,
  ],
  template: `
    <ng-container *ngIf="vm$ | async as vm">
      <div class="nec-row">
        <ng-container [ngSwitch]="vm.state">
          <ng-container *ngSwitchCase="'none'">
            <ng-content></ng-content>
          </ng-container>

          <p-tag *ngSwitchCase="'auto-restoring'" severity="info" icon="pi pi-spin pi-spinner"
                 value="Restoring saved data…"></p-tag>

          <button *ngSwitchCase="'manual-restoring'" type="button" pButton class="p-button-sm"
                  icon="pi pi-spin pi-spinner" label="Restoring…" [disabled]="true"></button>

          <ng-container *ngSwitchCase="'prompt'">
            <p-tag severity="info" [value]="statsSummary(vm.stats)"></p-tag>
            <p-tag *ngIf="vm.stats && vm.stats.draftCount" severity="warn" [value]="draftsSummary(vm.stats)"></p-tag>
            <p-tag *ngIf="vm.stats" severity="secondary" [value]="ageSummary(vm.stats)"></p-tag>
            <p-tag *ngIf="vm.restoreError" severity="danger" icon="pi pi-exclamation-triangle"
                   [value]="'Restore failed: ' + vm.restoreError"></p-tag>

            <ng-container *ngIf="!dismissPending(); else confirmDismiss">
              <button type="button" pButton class="p-button-sm" icon="pi pi-history" label="Restore"
                      (click)="restore()"></button>
              <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
                      icon="pi pi-search" label="New search" (click)="requestNewSearch()"></button>
            </ng-container>
            <ng-template #confirmDismiss>
              <span class="nec-note" role="alert">Discard {{ draftCountOf(vm.stats) }} unsaved change(s)?</span>
              <button type="button" pButton class="p-button-danger p-button-sm" icon="pi pi-check" label="Yes"
                      (click)="confirmNewSearch()"></button>
              <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
                      icon="pi pi-times" label="Cancel" (click)="cancelNewSearch()"></button>
            </ng-template>
          </ng-container>
        </ng-container>

        <ng-container *ngIf="vm.enabled">
        <p-tag *ngIf="vm.pendingWrites > 0" styleClass="nec-ml" severity="secondary" icon="pi pi-spin pi-sync"
               value="Saving…"></p-tag>
        <p-tag *ngIf="vm.quotaWarning" styleClass="nec-ml" severity="warn" icon="pi pi-exclamation-triangle"
               value="Storage almost full"></p-tag>

        <button type="button" pButton class="p-button-sm nec-ml"
                [class.p-button-outlined]="vm.saveMode !== 'always'"
                [class.p-button-secondary]="vm.saveMode !== 'always'"
                icon="pi pi-save"
                [attr.aria-pressed]="vm.saveMode === 'always'"
                [title]="vm.saveMode === 'always'
                  ? 'Salva sempre i risultati della ricerca — clic per disattivare'
                  : 'Salva i risultati solo alla prima modifica — clic per salvarli sempre'"
                (click)="toggleSaveMode(vm.saveMode)"></button>
        </ng-container>
      </div>
    </ng-container>
  `,
})
export class NecRestoreSearchComponent<T = unknown> implements OnInit, OnDestroy {
  /**
   * Bundle della sezione creato da `createPersistence` (`ngrx-entity-crud/persistence`): da solo
   * sostituisce `feature`, `selectors` e `actions`. Con `enabled: false` il componente e'
   * trasparente (mostra solo il contenuto proiettato).
   */
  @Input() persistence?: NecPersistence<T>;
  /**
   * @deprecated usare `[persistence]`.

   * Identifica la sezione: deve coincidere ESATTAMENTE con la `feature` passata a
   * `createPersistenceEffects`, perche' costruisce il `type` dell'azione dispatchata dal toggle
   * saveMode. Non e' un'etichetta di sola visualizzazione.
   */
  @Input() feature = '';
  /** @deprecated usare `[persistence]`. */
  @Input() selectors!: NecPersistenceSelectors;
  /** @deprecated usare `[persistence]`. */
  @Input() actions!: Actions<T>;
  /** Frazione (0-1) di `storage.estimate()` oltre la quale compare l'avviso di quota. */
  @Input() quotaWarningThreshold = 0.9;

  vm$!: Observable<NecRestoreSearchViewModel>;
  readonly dismissPending = signal(false);

  private readonly manualInFlight$ = new BehaviorSubject<boolean>(false);
  private readonly dismissed$ = new BehaviorSubject<boolean>(false);
  private readonly destroyed$ = new Subject<void>();
  private section!: NecResolvedSection<T>;

  constructor(
    private readonly store: Store,
    private readonly ngrxActions: NgrxActions,
    private readonly persistenceService: NecPersistenceService
  ) {
  }

  ngOnInit(): void {
    this.section = this.resolveSection();
    const {enabled, selectors, crudActions} = this.section;

    if (!enabled) {
      this.vm$ = of({
        state: 'none',
        stats: null,
        restoreError: null,
        pendingWrites: 0,
        quotaWarning: false,
        saveMode: 'on-draft',
        enabled: false,
      });
      return;
    }

    const check$: Observable<NecSectionCheck | null> = this.store.select(selectors.sectionCheck).pipe(startWith(null));

    const restoring$: Observable<boolean> = merge(
      this.ngrxActions.pipe(ofType(crudActions.RestoreRequest), map(() => true)),
      this.ngrxActions.pipe(ofType(crudActions.RestoreSuccess, crudActions.RestoreFailure), map(() => false))
    ).pipe(startWith(false));

    const restoreError$: Observable<string | null> = merge(
      this.ngrxActions.pipe(ofType(crudActions.RestoreRequest, crudActions.RestoreSuccess), map(() => null)),
      this.ngrxActions.pipe(ofType(crudActions.RestoreFailure), map(({error}) => error))
    ).pipe(startWith(null));

    // Un restore riuscito (automatico o manuale) chiude il prompt: i dati sono gia' applicati,
    // mostrare di nuovo "Restore" sarebbe fuorviante. Riusa `dismissed$`, stesso significato per
    // la vm: "niente altro da proporre qui", si torna al pulsante avvolto (stato 'none').
    this.ngrxActions.pipe(ofType(crudActions.RestoreSuccess), takeUntil(this.destroyed$)).subscribe(() => {
      this.manualInFlight$.next(false);
      this.dismissed$.next(true);
    });
    this.ngrxActions.pipe(ofType(crudActions.RestoreFailure), takeUntil(this.destroyed$))
      .subscribe(() => this.manualInFlight$.next(false));

    const quotaWarning$: Observable<boolean> = from(this.persistenceService.estimateStorage()).pipe(
      map((estimate) => this.isQuotaLow(estimate)),
      startWith(false)
    );

    this.vm$ = combineLatest([
      check$,
      restoring$,
      this.manualInFlight$,
      this.dismissed$,
      restoreError$,
      this.persistenceService.pendingWrites$,
      quotaWarning$,
    ]).pipe(
      map(([check, restoring, manualInFlight, dismissed, restoreError, pendingWrites, quotaWarning]) => {
        const stats = check?.stats ?? null;
        const saveMode = check?.saveMode ?? 'on-draft';
        if (restoring && manualInFlight) {
          return {state: 'manual-restoring', stats, restoreError: null, pendingWrites, quotaWarning, saveMode, enabled} as const;
        }
        if (restoring && check?.autoRestoreTriggered) {
          return {state: 'auto-restoring', stats, restoreError: null, pendingWrites, quotaWarning, saveMode, enabled} as const;
        }
        if (dismissed || !stats) {
          return {state: 'none', stats: null, restoreError: null, pendingWrites, quotaWarning, saveMode, enabled} as const;
        }
        return {state: 'prompt', stats, restoreError, pendingWrites, quotaWarning, saveMode, enabled} as const;
      })
    );
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
  }

  restore(): void {
    this.manualInFlight$.next(true);
    this.store.dispatch(this.section.crudActions.RestoreRequest());
  }

  requestNewSearch(): void {
    this.dismissPending.set(true);
  }

  confirmNewSearch(): void {
    this.dismissPending.set(false);
    this.dismissed$.next(true);
  }

  cancelNewSearch(): void {
    this.dismissPending.set(false);
  }

  /** Inverte 'on-draft'/'always' per questa sezione — il toggle nella riga del pulsante Search. */
  toggleSaveMode(current: NecSaveMode): void {
    this.store.dispatch(this.section.setSaveMode({mode: current === 'always' ? 'on-draft' : 'always'}));
  }

  private resolveSection(): NecResolvedSection<T> {
    const bundle = this.persistence;
    if (bundle) {
      return {
        enabled: bundle.enabled,
        selectors: bundle.selectors,
        crudActions: bundle.crudActions,
        setSaveMode: bundle.actions.SetSectionSaveMode,
      };
    }
    if (isDevMode() && !this.feature) {
      console.warn(
        '<nec-restore-search>: [feature] non valorizzato. Deve coincidere con la `feature` passata a ' +
        'createPersistenceEffects, altrimenti il toggle saveMode non raggiunge nessun effect. ' +
        'Meglio passare [persistence] (createPersistence).'
      );
    }
    return {
      enabled: true,
      selectors: this.selectors,
      crudActions: this.actions,
      setSaveMode: createSetSectionSaveModeAction(this.feature),
    };
  }

  statsSummary(stats: NecSectionStats | null): string {
    return pluralize(stats?.count ?? 0, 'result saved', 'results saved');
  }

  draftsSummary(stats: NecSectionStats | null): string {
    return pluralize(stats?.draftCount ?? 0, 'unsent change', 'unsent changes');
  }

  ageSummary(stats: NecSectionStats | null): string {
    return `${formatBytes(stats?.bytes ?? 0)} — ${formatAge(stats?.at ?? Date.now())}`;
  }

  draftCountOf(stats: NecSectionStats | null): number {
    return stats?.draftCount ?? 0;
  }

  private isQuotaLow(estimate: StorageEstimate | null): boolean {
    if (!estimate || !estimate.quota || estimate.usage === undefined) {
      return false;
    }
    return estimate.usage / estimate.quota >= this.quotaWarningThreshold;
  }
}
