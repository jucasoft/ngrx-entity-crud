import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Coin} from '@models/vo/coin';
import {Observable} from 'rxjs';
import {CoinStoreActions, CoinStoreSelectors, RootStoreState, RouterStoreActions} from '../../../../root-store';
import {Store} from '@ngrx/store';

@Component({
  selector: 'app-coin-list',
  templateUrl: './coin-list.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CoinListComponent implements OnInit {

  collection$: Observable<Coin[]>;

  constructor(private store$: Store<RootStoreState.State>) {
    console.log('CoinListComponent.constructor()');
  }

  ngOnInit() {
    console.log('CoinListComponent.ngOnInit()');

    this.collection$ = this.store$.select(
      CoinStoreSelectors.selectAll
    );

    this.store$.dispatch(
      CoinStoreActions.SearchRequest({})
    );

  }

  onEdit(item) {
    console.log('CoinListComponent.onEdit()');
    this.store$.dispatch(CoinStoreActions.Edit({item}));
    this.store$.dispatch(RouterStoreActions.RouterGo({path: ['coin', 'edit']}));
  }

  onDelete(item) {
    console.log('CoinListComponent.onDelete()');

  }


}
