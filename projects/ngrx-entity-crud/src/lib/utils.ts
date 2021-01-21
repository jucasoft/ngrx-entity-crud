import {MonoTypeOperatorFunction} from 'rxjs';
import {filter} from 'rxjs/operators';
import {ActionEnum, IdSelector} from './models';
import {Action} from '@ngrx/store/src/models';
import {isDevMode} from '@angular/core';

export const ofFailure = <T extends Action>(): MonoTypeOperatorFunction<T> => {
  return input$ => input$.pipe(filter(value => value.type.endsWith(ActionEnum.FAILURE)));
};

export function selectIdValue<T>(entity: T, selectId: IdSelector<T>) {
  const key = selectId(entity);

  if (isDevMode() && key === undefined) {
    console.warn(
      '@ngrx/entity: The entity passed to the `selectId` implementation returned undefined.',
      'You should probably provide your own `selectId` implementation.',
      'The entity that was passed:',
      entity,
      'The `selectId` implementation:',
      selectId.toString()
    );
  }

  return key;
}
