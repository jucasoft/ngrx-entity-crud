import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, of} from 'rxjs';
import {RouterStoreActions} from '@root-store/router-store/index';
import {PopUpData} from '@root-store/router-store/pop-up-base.component';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';
import {RootStoreState} from '@root-store/index';

@Component({
  selector: 'app-button-delete-<%= dasherize(clazz) %>',
  template: `
    <button type="button" *ngLet="(itemsSelected$|async) as itemsSelected" pButton icon="pi pi-trash"
            label="Delete" (click)="onDelete(itemsSelected)"
            [disabled]="!(itemsSelected.length > 0)"
            class="p-button-danger"></button>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ButtonDelete<%= clazz %>Component implements OnInit {

  itemsSelected$: Observable<<%= clazz %>[]>;

  constructor(private readonly store$: Store<RootStoreState.State>) {
  }

  ngOnInit(): void {
    this.itemsSelected$ = this.store$.pipe(
      select(<%= clazz %>StoreSelectors.selectItemsSelected)
    );
  }

  onDelete(items: <%= clazz %>[]): void {
    this.store$.dispatch(<%= clazz %>StoreActions.DeleteManyRequest({items}));
  }


}
