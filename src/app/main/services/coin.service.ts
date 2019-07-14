import {Injectable} from '@angular/core';
import {BaseCrudService} from 'ngrx-entity-crud';
import {Coin} from '@models/vo/coin';

@Injectable({
  providedIn: 'root'
})
export class CoinService extends BaseCrudService<Coin> {
  service = ' http://localhost:3000/coin';
}
