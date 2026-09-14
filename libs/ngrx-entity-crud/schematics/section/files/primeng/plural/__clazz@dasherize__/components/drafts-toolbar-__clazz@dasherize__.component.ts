import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {<%= clazz %>StoreActions, <%= clazz %>StoreSelectors, RootStoreState} from '@root-store/index';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {dirtyDrafts} from '../<%= dasherize(clazz) %>-drafts';

/**
 * Comandi sulle bozze locali (entitiesSelected):
 * - "Save drafts" invia al server le sole righe modificate (EditMany),
 * - "Discard drafts" svuota entitiesSelected (RemoveAllSelected).
 */
@Component({
  selector: 'app-drafts-toolbar-<%= dasherize(clazz) %>',
  template: `
    <ng-container *ngLet="(dirtyItems$|async) as dirtyItems">
      <button type="button" pButton icon="pi pi-save"
              label="Save drafts ({{dirtyItems.length}})" (click)="onSave(dirtyItems)"
              [disabled]="!(dirtyItems.length > 0)"
              class="p-button-success mr-2"></button>
      <button type="button" pButton icon="pi pi-undo"
              label="Discard drafts" (click)="onDiscard()"
              [disabled]="!(dirtyItems.length > 0)"
              class="p-button-secondary p-button-outlined"></button>
    </ng-container>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DraftsToolbar<%= clazz %>Component implements OnInit {

  dirtyItems$: Observable<<%= clazz %>[]>;

  constructor(private readonly store$: Store<RootStoreState.State>) {
  }

  ngOnInit(): void {
    this.dirtyItems$ = combineLatest([
      this.store$.pipe(select(<%= clazz %>StoreSelectors.selectEntities)),
      this.store$.pipe(select(<%= clazz %>StoreSelectors.selectEntitiesSelected))
    ]).pipe(
      map(([entities, drafts]) => dirtyDrafts(entities, drafts))
    );
  }

  onSave(mutationParams: <%= clazz %>[]): void {
    this.store$.dispatch(<%= clazz %>StoreActions.EditManyRequest({mutationParams}));
  }

  onDiscard(): void {
    this.store$.dispatch(<%= clazz %>StoreActions.RemoveAllSelected());
  }

}
