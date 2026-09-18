import {Inject, Injectable, Optional, Type} from '@angular/core';
import {Actions as NgrxActions, createEffect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {defer, EMPTY, from, merge, Observable, of, ReplaySubject} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, tap} from 'rxjs/operators';
import {Actions, ICriteria} from 'ngrx-entity-crud';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSectionStats} from './models';
import {NEC_PERSISTENCE_CONFIG} from './persistence-config.token';
import {NecPersistenceService} from './nec-persistence.service';

/** Default se né la sezione né `NEC_PERSISTENCE_CONFIG` specificano `debounceMs`. */
const DEFAULT_DEBOUNCE_MS = 200;

export interface NecPersistenceEffectsConfig<T> {
  feature: string;
  selectId: (item: T) => string | number;
  actions: Actions<T>;
  /** Sovrascrive, se presente, il default globale di `NEC_PERSISTENCE_CONFIG.autoRestore`. */
  autoRestore?: NecAutoRestoreConfig;
}

/** Esito del check leggero eseguito alla creazione della sezione (decisioni 11/12 del piano). */
export interface NecSectionCheck {
  stats: NecSectionStats | null;
  autoRestoreTriggered: boolean;
}

/**
 * Superficie pubblica della classe generata da `createPersistenceEffects`: gli effect richiesti
 * da `EffectsModule.forFeature([...])`, più `sectionCheck$` per il componente (Fase 3) e per i
 * test — che possono sottoscrivere ogni effect direttamente, senza passare da `EffectsModule`.
 */
export interface NecPersistenceEffects {
  /**
   * Esito del check leggero `stats(feature)` eseguito una sola volta, alla creazione della
   * sezione. Il componente (`<nec-restore-search>`, Fase 3) legge questo observable invece di
   * ripetere la query.
   */
  readonly sectionCheck$: Observable<NecSectionCheck>;
  readonly autoRestoreCheckOn$: Observable<Action>;
  readonly restoreRequestOn$: Observable<Action>;
  readonly searchRequestOn$: Observable<unknown>;
  readonly searchSuccessOn$: Observable<unknown>;
  readonly draftsPutOn$: Observable<unknown>;
  readonly removeManySelectedOn$: Observable<unknown>;
  readonly removeAllSelectedOn$: Observable<unknown>;
  readonly deleteSuccessOn$: Observable<unknown>;
  readonly deleteManySuccessOn$: Observable<unknown>;
}

/**
 * Effect factory per sezione: genera una classe Angular Effects pronta per
 * `EffectsModule.forFeature([createPersistenceEffects({...})])` — lo stesso punto di
 * registrazione per store eager e lazy (vedi "Aggancio" in `ngrx-entity-crud-persistence-plan.md`).
 *
 * Traduce la tabella "Ciclo di vita per sezione" del piano in effect `{dispatch: false}` (scrivono
 * e basta), più due effect che dispatchano: la traduzione di `RestoreRequest` in lettura, e il
 * check leggero di freschezza eseguito una sola volta alla creazione — che dispatcha da sé
 * `RestoreRequest` se i dati locali rientrano in `autoRestore`.
 */
export function createPersistenceEffects<T>(config: NecPersistenceEffectsConfig<T>): Type<NecPersistenceEffects> {
  const {feature, selectId, actions} = config;

  @Injectable()
  class NecSectionPersistenceEffects implements NecPersistenceEffects {
    private readonly pendingDrafts = new Map<string, T>();
    private readonly checkSubject = new ReplaySubject<NecSectionCheck>(1);
    readonly sectionCheck$: Observable<NecSectionCheck> = this.checkSubject.asObservable();

    // Dichiarati qui ma assegnati nel corpo del costruttore (non come field initializer): per una
    // classe senza `extends`, i field initializer girano PRIMA del corpo del costruttore (spec
    // InitializeInstanceElements), quindi prima che le parameter property (actions$, persistence,
    // globalConfig) vengano assegnate — leggerle da un field initializer li trova `undefined`.
    // Vedi bug osservato a runtime: "Cannot read properties of undefined (reading 'pipe')".
    readonly autoRestoreCheckOn$: Observable<Action>;
    readonly restoreRequestOn$: Observable<Action>;
    readonly searchRequestOn$: Observable<unknown>;
    readonly searchSuccessOn$: Observable<unknown>;
    readonly draftsPutOn$: Observable<unknown>;
    readonly removeManySelectedOn$: Observable<unknown>;
    readonly removeAllSelectedOn$: Observable<unknown>;
    readonly deleteSuccessOn$: Observable<unknown>;
    readonly deleteManySuccessOn$: Observable<unknown>;

    constructor(
      private readonly actions$: NgrxActions,
      private readonly persistence: NecPersistenceService,
      @Optional() @Inject(NEC_PERSISTENCE_CONFIG) private readonly globalConfig: NecPersistenceConfig | null
    ) {
      // Check leggero eseguito UNA SOLA VOLTA: `createEffect` sottoscrive l'observable non appena
      // la classe viene istanziata da EffectsModule, quindi questo `defer` gira nello stesso istante
      // in cui la sezione (eager o lazy) viene creata, non quando un componente si monta.
      this.autoRestoreCheckOn$ = createEffect(() => defer(() => from(this.persistence.stats(feature))).pipe(
        map((stats) => this.evaluateAutoRestore(stats)),
        tap(({stats, autoRestoreTriggered}) => this.checkSubject.next({stats, autoRestoreTriggered})),
        map(({action}) => action),
        filter((action): action is Action => action !== null),
        catchError(() => {
          this.checkSubject.next({stats: null, autoRestoreTriggered: false});
          return EMPTY;
        })
      ));

      // Traduce RestoreRequest in lettura da IndexedDB, che parta dal check sopra o dal componente.
      this.restoreRequestOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.RestoreRequest),
        switchMap(() => from(this.persistence.readSection<T, ICriteria>(feature)).pipe(
          map((section) => section

            ? actions.RestoreSuccess({
              items: section.ids.map((id) => section.entities[id]).filter((item): item is T => item !== undefined),
              selected: Object.values(section.drafts).filter((item): item is T => item !== undefined),
              criteria: section.criteria
            })
            : actions.RestoreFailure({error: 'Nessun dato locale per questa sezione'})),
          catchError((error) => of(actions.RestoreFailure({error: error?.message ?? String(error)})))
        ))
      ));

      this.searchRequestOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.SearchRequest),
        switchMap(() => from(this.persistence.purgeSection(feature)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.searchSuccessOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.SearchSuccess),
        switchMap(({items, request}) => from(
          this.persistence.writeSearch<T, ICriteria>(feature, request, items, selectId)
        ).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      // Debounce sull'azione, non sulla scrittura: accumula gli item toccati durante la finestra di
      // silenzio e li scrive in un solo giro, cosi' due righe diverse modificate nella stessa
      // finestra finiscono entrambe su IndexedDB invece che solo l'ultima (un plain `debounceTime`
      // sull'azione perderebbe le righe intermedie).
      this.draftsPutOn$ = createEffect(() => merge(
        this.actions$.pipe(ofType(actions.AddManySelected), map(({items}) => items)),
        this.actions$.pipe(ofType(actions.SelectItems), map(({items}) => items))
      ).pipe(
        tap((items) => items.forEach((item) => this.pendingDrafts.set(String(selectId(item)), item))),
        debounceTime(this.globalConfig?.debounceMs ?? DEFAULT_DEBOUNCE_MS),
        switchMap(() => {
          const items = Array.from(this.pendingDrafts.values());
          this.pendingDrafts.clear();
          return items.length
            ? from(this.persistence.putDrafts(feature, items, selectId)).pipe(catchError(() => EMPTY))
            : EMPTY;
        })
      ), {dispatch: false});

      this.removeManySelectedOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.RemoveManySelected),
        switchMap(({ids}) => from(this.persistence.deleteDrafts(feature, ids)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.removeAllSelectedOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.RemoveAllSelected),
        switchMap(() => from(this.persistence.deleteAllDrafts(feature)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.deleteSuccessOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.DeleteSuccess),
        switchMap(({id}) => from(this.persistence.deleteDrafts(feature, [id])).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.deleteManySuccessOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.DeleteManySuccess),
        switchMap(({ids}) => from(this.persistence.deleteDrafts(feature, ids)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});
    }

    private autoRestoreConfig(): NecAutoRestoreConfig | undefined {
      return config.autoRestore ?? this.globalConfig?.autoRestore ?? undefined;
    }

    private evaluateAutoRestore(stats: NecSectionStats | null): NecSectionCheck & { action: Action | null } {
      const autoRestore = this.autoRestoreConfig();
      if (!stats || !autoRestore) {
        return {stats, autoRestoreTriggered: false, action: null};
      }
      const withinAge = Date.now() - stats.at <= autoRestore.maxAgeMs;
      const withinBytes = autoRestore.maxBytes === undefined || stats.bytes <= autoRestore.maxBytes;
      const triggered = withinAge && withinBytes;
      return {stats, autoRestoreTriggered: triggered, action: triggered ? actions.RestoreRequest() : null};
    }
  }

  return NecSectionPersistenceEffects;
}
