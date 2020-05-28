import {MonoTypeOperatorFunction} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ActionEnum} from './models';
import {Action} from '@ngrx/store/src/models';

export const ofFailure = <T extends Action>(): MonoTypeOperatorFunction<T> => {
  return input$ => input$.pipe(filter(value => value.type.endsWith(ActionEnum.FAILURE)));
};
