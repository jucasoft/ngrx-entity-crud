import {MenuItem} from 'primeng/api';
import {map} from 'rxjs/operators';
import {Store} from '@ngrx/store';

export const menuItemsDecoratorFn: (itemsA: MenuItem[], store$) => MenuItem[] = (itemsA: MenuItem[], store$: Store) => {
  return itemsA.map(value => {
      const result: any = {...value};
      if (!!result.command) {
        result.store$ = store$;
      }
      if (!!result.items) {
        result.items = menuItemsDecoratorFn(result.items, store$);
      }
      return result;
    }
  );
};

export const menuItemsDecorator = (store$: Store) => {
  return (input$: any) => input$.pipe(
    map((items: MenuItem[]): MenuItem[] => {
      return menuItemsDecoratorFn(items, store$);
    })
  );
};
