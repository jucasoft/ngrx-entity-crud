import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {<%= clazz %>StoreActions, <%= clazz %>StoreSelectors, RootStoreState} from '@root-store/index';
import {combineLatest, Observable} from 'rxjs';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {RouterStoreActions} from '@root-store/router-store/index';
import {map, tap} from 'rxjs/operators';
import {ConfirmationService} from 'primeng/api';
import {PopUpData} from '@root-store/router-store/pop-up-base.component';
import {Dictionary} from '@ngrx/entity';
import {dirtyDraftIds} from '../<%= dasherize(clazz) %>-drafts';

@Component({
  selector: 'app-<%= dasherize(clazz) %>-list',
  templateUrl: `<%= dasherize(clazz) %>-list.component.html`,
  styles: [`
    .draft-row > td {
      background-color: var(--yellow-100);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= clazz %>ListComponent implements OnInit {


  /**
   * righe visualizzate: bozza locale (entitiesSelected) se presente, altrimenti dato dello store.
   */
  rows$: Observable<<%= clazz %>[]>;
  /**
   * id delle righe la cui bozza diverge dall'originale.
   */
  dirtyIds$: Observable<string[]>;
  cols: any;
  itemsSelected$: Observable<<%= clazz %>[]>;

  /**
   * copia locale delle entita' originali, usata per le azioni che devono lavorare sul dato dello store
   * e non sulla bozza (es. delete).
   */
  private origins: Dictionary<<%= clazz %>> = {};
  /**
   * valore della cella prima dell'editing: serve ad evitare dispatch inutili quando non cambia nulla.
   */
  private editingValue: any;

  constructor(private store$: Store<RootStoreState.State>,
              private confirmationService: ConfirmationService) {
    console.log('<%= clazz %>ListComponent.constructor()');
  }

  ngOnInit(): void {
    console.log('<%= clazz %>ListComponent.ngOnInit()');

    this.itemsSelected$ = this.store$.pipe(
      select(<%= clazz %>StoreSelectors.selectItemsSelected)
    );

    const entities$: Observable<Dictionary<<%= clazz %>>> = this.store$.pipe(
      select(<%= clazz %>StoreSelectors.selectEntities),
      tap(entities => this.origins = entities)
    );

    const drafts$: Observable<Dictionary<<%= clazz %>>> = this.store$.pipe(
      select(<%= clazz %>StoreSelectors.selectEntitiesSelected)
    );

    this.rows$ = combineLatest([
      this.store$.select(<%= clazz %>StoreSelectors.selectAll),
      drafts$
    ]).pipe(
      tap(([values]) => {
        if (values && values.length > 0) {
          this.cols = Object.keys(values[0]);
        }
      }),
      // la copia dell'oggetto e' obbligatoria: l'editing inline scrive tramite ngModel
      // e lo stato dello store non va mai mutato.
      map(([values, drafts]) => values.map(value => ({...(drafts[value.id] || value)})))
    );

    this.dirtyIds$ = combineLatest([entities$, drafts$]).pipe(
      map(([entities, drafts]) => dirtyDraftIds(entities, drafts))
    );

    this.store$.dispatch(
      <%= clazz %>StoreActions.SearchRequest({queryParams: {}})
    );

  }

  isDirty(item: <%= clazz %>, dirtyIds: string[]): boolean {
    return !!dirtyIds && dirtyIds.indexOf(String(item.id)) !== -1;
  }

  /**
   * sono editabili tutte le colonne valorizzate con un tipo primitivo, tranne la chiave.
   */
  isEditable(item: <%= clazz %>, col: string): boolean {
    if (col === 'id') {
      return false;
    }
    const type = typeof item[col];
    return type === 'string' || type === 'number';
  }

  inputType(value: any): string {
    return typeof value === 'number' ? 'number' : 'text';
  }

  onEditInit(event: { field: string, data: <%= clazz %> }): void {
    this.editingValue = event.data[event.field];
  }

  /**
   * al termine dell'editing della cella la riga modificata viene messa in bozza:
   * AddManySelected fa l'upsert su entitiesSelected, quindi la riga risulta anche selezionata.
   */
  onEditComplete(event: { field: string, data: <%= clazz %> }): void {
    if (event.data[event.field] === this.editingValue) {
      return;
    }
    this.store$.dispatch(<%= clazz %>StoreActions.AddManySelected({items: [{...event.data}]}));
  }

  /**
   * scarta la bozza della singola riga: la riga torna al dato dello store e viene deselezionata.
   */
  onUndoDraft(item: <%= clazz %>): void {
    this.store$.dispatch(<%= clazz %>StoreActions.RemoveManySelected({ids: [String(item.id)]}));
  }

  onEdit(item): void {
    console.log('<%= clazz %>ListComponent.onEdit()');

    const data: PopUpData<<%= clazz %>> = {
      item,
      props: {title: 'Edit <%= clazz %>', route: '<%= dasherize(clazz) %>'}
    };

    // apro la popUP
    this.store$.dispatch(RouterStoreActions.RouterGoPopUp({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}],
      data
    }));

  }

  onCopy(value): void {
    console.log('<%= clazz %>ListComponent.onCopy()');

    const item = {...{}, ...value, ...{id: null}};
    const data: PopUpData<<%= clazz %>> = {
      item,
      props: {title: 'Copy <%= clazz %>', route: '<%= dasherize(clazz) %>'}
    };

    this.store$.dispatch(RouterStoreActions.RouterGoPopUp({
      path: ['<%= dasherize(clazz) %>', {outlets: {popUp: ['edit']}}],
      data
    }));

  }

  onDelete(item): void {

    // la cancellazione lavora sempre sul dato dello store, non sulla eventuale bozza.
    const mutationParams = this.origins[item.id] || item;

    this.confirmationService.confirm({
      message: 'Are you sure that you want to perform this action?',
      accept: () => {
        this.store$.dispatch(<%= clazz %>StoreActions.DeleteRequest({mutationParams}));
      }
    });

  }

  onSelectionChange(items: <%= clazz %>[]): void {
    console.log('<%= clazz %>ListComponent.onSelectionChange()');
    console.log('items', items);
    // gli item passati sono quelli visualizzati (bozza compresa), quindi selezionare/deselezionare
    // non perde le modifiche gia' fatte sulle altre righe.
    this.store$.dispatch(<%= clazz %>StoreActions.SelectItems({items}));
  }

}
