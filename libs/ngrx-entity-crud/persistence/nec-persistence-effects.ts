import {Inject, Injectable, Optional, Type} from '@angular/core';
import {Actions as NgrxActions, createEffect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {defer, EMPTY, from, merge, Observable, of} from 'rxjs';
import {catchError, debounceTime, filter, map, switchMap, tap} from 'rxjs/operators';
import {Actions, ICriteria} from 'ngrx-entity-crud';
import {NecAutoRestoreConfig, NecPersistenceConfig, NecSaveMode, NecSectionCheck, NecSectionStats} from './models';
import {NEC_PERSISTENCE_CONFIG} from './persistence-config.token';
import {NecPersistenceService} from './nec-persistence.service';
import {createSectionCheckSuccessAction, createSetSectionSaveModeAction} from './nec-persistence-actions';

const DEFAULT_SAVE_MODE: NecSaveMode = 'on-draft';

/** Default se né la sezione né `NEC_PERSISTENCE_CONFIG` specificano `debounceMs`. */
const DEFAULT_DEBOUNCE_MS = 200;

export interface NecPersistenceEffectsConfig<T> {
  feature: string;
  selectId: (item: T) => string | number;
  actions: Actions<T>;
  /** Sovrascrive, se presente, il default globale di `NEC_PERSISTENCE_CONFIG.autoRestore`. */
  autoRestore?: NecAutoRestoreConfig;
}

/**
 * Superficie pubblica della classe generata da `createPersistenceEffects`: gli effect richiesti
 * da `EffectsModule.forFeature([...])` — anche per i test, che possono sottoscrivere ogni effect
 * direttamente, senza passare da `EffectsModule`.
 */
export interface NecPersistenceEffects {
  readonly autoRestoreCheckOn$: Observable<Action>;
  /** Traduce un `SectionCheckSuccess` con `autoRestoreTriggered: true` in `RestoreRequest`. */
  readonly autoRestoreTriggerOn$: Observable<Action>;
  readonly restoreRequestOn$: Observable<Action>;
  readonly searchRequestOn$: Observable<unknown>;
  readonly searchSuccessOn$: Observable<unknown>;
  readonly draftsPutOn$: Observable<unknown>;
  readonly removeManySelectedOn$: Observable<unknown>;
  readonly removeAllSelectedOn$: Observable<unknown>;
  readonly deleteSuccessOn$: Observable<unknown>;
  readonly deleteManySuccessOn$: Observable<unknown>;
  /** Persiste la scelta dell'utente su come salvare (`<nec-restore-search>`), vedi `NecSaveMode`. */
  readonly setSaveModeOn$: Observable<unknown>;
}

/**
 * Effect factory per sezione: genera una classe Angular Effects pronta per
 * `EffectsModule.forFeature([createPersistenceEffects({...})])` — lo stesso punto di
 * registrazione per store eager e lazy (vedi "Aggancio" in `ngrx-entity-crud-persistence-plan.md`).
 *
 * Traduce la tabella "Ciclo di vita per sezione" del piano in effect `{dispatch: false}` (scrivono
 * e basta), più tre effect che dispatchano: la traduzione di `RestoreRequest` in lettura
 * (`restoreRequestOn$`), il check leggero di freschezza eseguito una sola volta alla creazione
 * (`autoRestoreCheckOn$`, dispatcha `SectionCheckSuccess` — lo stato lo scrive
 * `createPersistenceReducer`, lo legge `createPersistenceSelectors`) e la sua traduzione in
 * `RestoreRequest` quando i dati locali rientrano in `autoRestore` (`autoRestoreTriggerOn$`).
 */
export function createPersistenceEffects<T>(config: NecPersistenceEffectsConfig<T>): Type<NecPersistenceEffects> {
  const {feature, selectId, actions} = config;

  @Injectable()
  class NecSectionPersistenceEffects implements NecPersistenceEffects {
    private readonly pendingDrafts = new Map<string, T>();
    /**
     * Ultima `SearchSuccess` ricevuta, tenuta solo in memoria: il blocco `search[feature]` non si
     * scrive più qui (vedi `searchSuccessOn$`), ma alla prima bozza (`draftsPutOn$`), che ne ha
     * bisogno per scrivere `entities`+criteri insieme al draft.
     */
    private lastSearch: {criteria: ICriteria; items: T[]} | null = null;
    /** true dopo che il blocco search e' stato scritto per la ricerca corrente (si scrive una sola volta). */
    private searchPersisted = false;
    /** Letto dal check alla creazione della sezione, aggiornato a runtime da `setSaveModeOn$`. */
    private saveMode: NecSaveMode = DEFAULT_SAVE_MODE;

    // Dichiarati qui ma assegnati nel corpo del costruttore (non come field initializer): per una
    // classe senza `extends`, i field initializer girano PRIMA del corpo del costruttore (spec
    // InitializeInstanceElements), quindi prima che le parameter property (actions$, persistence,
    // globalConfig) vengano assegnate — leggerle da un field initializer li trova `undefined`.
    // Vedi bug osservato a runtime: "Cannot read properties of undefined (reading 'pipe')".
    readonly autoRestoreCheckOn$: Observable<Action>;
    readonly autoRestoreTriggerOn$: Observable<Action>;
    readonly restoreRequestOn$: Observable<Action>;
    readonly searchRequestOn$: Observable<unknown>;
    readonly searchSuccessOn$: Observable<unknown>;
    readonly draftsPutOn$: Observable<unknown>;
    readonly removeManySelectedOn$: Observable<unknown>;
    readonly removeAllSelectedOn$: Observable<unknown>;
    readonly deleteSuccessOn$: Observable<unknown>;
    readonly deleteManySuccessOn$: Observable<unknown>;
    readonly setSaveModeOn$: Observable<unknown>;

    constructor(
      private readonly actions$: NgrxActions,
      private readonly persistence: NecPersistenceService,
      @Optional() @Inject(NEC_PERSISTENCE_CONFIG) private readonly globalConfig: NecPersistenceConfig | null
    ) {
      const sectionCheckSuccess = createSectionCheckSuccessAction(feature);
      const setSectionSaveMode = createSetSectionSaveModeAction(feature);

      // Check leggero eseguito UNA SOLA VOLTA: `createEffect` sottoscrive l'observable non appena
      // la classe viene istanziata da EffectsModule, quindi questo `defer` gira nello stesso istante
      // in cui la sezione (eager o lazy) viene creata, non quando un componente si monta. Dispatcha
      // sempre SectionCheckSuccess: il reducer generato da createPersistenceReducer lo scrive nello
      // store, il componente lo legge da li' via createPersistenceSelectors — mai piu' un
      // side-channel fuori dallo store. Legge anche `saveMode` (object store separato, sopravvive a
      // `purgeSection`) nello stesso giro, cosi' la preferenza scelta in una sessione precedente e'
      // gia' pronta prima che arrivi una eventuale SearchSuccess.
      this.autoRestoreCheckOn$ = createEffect(() => defer(() => from(
        Promise.all([this.persistence.stats(feature), this.persistence.getSaveMode(feature)])
      )).pipe(
        tap(([, saveMode]) => {
          this.saveMode = saveMode;
        }),
        map(([stats, saveMode]) => this.evaluateAutoRestore(stats, saveMode)),
        map((check) => sectionCheckSuccess({check})),
        catchError(() => of(sectionCheckSuccess({check: {stats: null, autoRestoreTriggered: false, saveMode: this.saveMode}})))
      ));

      // Il toggle in `<nec-restore-search>` dispatcha questa action: aggiorna il comportamento a
      // runtime (letto da `searchSuccessOn$`/`evaluateAutoRestore`) e lo persiste (sopravvive a
      // `purgeSection`, vedi `NecPersistenceService.setSaveMode`).
      this.setSaveModeOn$ = createEffect(() => this.actions$.pipe(
        ofType(setSectionSaveMode),
        tap(({mode}) => {
          this.saveMode = mode;
        }),
        switchMap(({mode}) => from(this.persistence.setSaveMode(feature, mode)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      // Traduce un check con autoRestoreTriggered in RestoreRequest: separato dal check sopra cosi'
      // ogni effect dispatcha un solo tipo di esito.
      this.autoRestoreTriggerOn$ = createEffect(() => this.actions$.pipe(
        ofType(sectionCheckSuccess),
        filter(({check}) => check.autoRestoreTriggered),
        map(() => actions.RestoreRequest())
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
        tap(() => {
          this.lastSearch = null;
          this.searchPersisted = false;
          // Una bozza ancora in debounce appartiene alla ricerca precedente: scriverla dopo
          // purgeSection lascerebbe una bozza orfana senza blocco search.
          this.pendingDrafts.clear();
        }),
        switchMap(() => from(this.persistence.purgeSection(feature)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.searchSuccessOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.SearchSuccess),
        tap(({items, request}) => {
          this.lastSearch = {criteria: request, items};
        }),
        // saveMode 'always': scrive subito, senza aspettare una bozza (il toggle esiste apposta
        // per chi vuole ritrovare anche i soli risultati della ricerca al riavvio).
        switchMap(() => this.saveMode === 'always'
          ? from(this.persistSearchIfNeeded()).pipe(catchError(() => EMPTY))
          : EMPTY)
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
          if (!items.length) {
            return EMPTY;
          }
          return from(this.persistSearchIfNeeded().then(() => this.persistence.putDrafts(feature, items, selectId)))
            .pipe(catchError(() => EMPTY));
        })
      ), {dispatch: false});

      this.removeManySelectedOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.RemoveManySelected),
        tap(({ids}) => this.discardPendingDrafts(ids)),
        switchMap(({ids}) => from(this.persistence.deleteDrafts(feature, ids)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.removeAllSelectedOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.RemoveAllSelected),
        tap(() => this.pendingDrafts.clear()),
        switchMap(() => from(this.persistence.deleteAllDrafts(feature)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.deleteSuccessOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.DeleteSuccess),
        tap(({id}) => this.discardPendingDrafts([id])),
        switchMap(({id}) => from(this.persistence.deleteDrafts(feature, [id])).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});

      this.deleteManySuccessOn$ = createEffect(() => this.actions$.pipe(
        ofType(actions.DeleteManySuccess),
        tap(({ids}) => this.discardPendingDrafts(ids)),
        switchMap(({ids}) => from(this.persistence.deleteDrafts(feature, ids)).pipe(catchError(() => EMPTY)))
      ), {dispatch: false});
    }

    /** Scrive il blocco `search[feature]` una sola volta per ricerca, alla prima bozza che lo richiede. */
    private persistSearchIfNeeded(): Promise<void> {
      if (this.searchPersisted || !this.lastSearch) {
        return Promise.resolve();
      }
      const {criteria, items} = this.lastSearch;
      this.searchPersisted = true;
      // Se la scrittura fallisce il blocco va ritentato alla bozza successiva: senza di esso
      // readSection() restituisce null e le bozze scritte dopo non sarebbero piu' ripristinabili.
      return this.persistence.writeSearch<T, ICriteria>(feature, criteria, items, selectId).catch((error) => {
        this.searchPersisted = false;
        throw error;
      });
    }

    /** Toglie dalle bozze in attesa di debounce le righe rimosse, cosi' non vengono riscritte dopo deleteDrafts. */
    private discardPendingDrafts(ids: Array<string | number>): void {
      (ids || []).forEach((id) => this.pendingDrafts.delete(String(id)));
    }

    private autoRestoreConfig(): NecAutoRestoreConfig | undefined {
      return config.autoRestore ?? this.globalConfig?.autoRestore ?? undefined;
    }

    private evaluateAutoRestore(rawStats: NecSectionStats | null, saveMode: NecSaveMode): NecSectionCheck {
      // In 'on-draft' senza bozze il blocco search non protegge nulla che una nuova ricerca non
      // ricostruirebbe gratis: trattarlo come dato locale utile mostrerebbe un prompt "Restore"
      // fuorviante (puo' capitare con draftCount tornato a 0 dopo che tutte le bozze sono state
      // rimosse, il record meta/search resta scritto ma senza piu' nulla da proteggere). In
      // 'always' il filtro non si applica: e' lo scopo stesso del toggle, il blocco esiste apposta
      // per essere ripristinato anche senza bozze.
      const stats = rawStats && (saveMode === 'always' || rawStats.draftCount > 0) ? rawStats : null;
      const autoRestore = this.autoRestoreConfig();
      if (!stats || !autoRestore) {
        return {stats, autoRestoreTriggered: false, saveMode};
      }
      const withinAge = Date.now() - stats.at <= autoRestore.maxAgeMs;
      const withinBytes = autoRestore.maxBytes === undefined || stats.bytes <= autoRestore.maxBytes;
      return {stats, autoRestoreTriggered: withinAge && withinBytes, saveMode};
    }
  }

  return NecSectionPersistenceEffects;
}
