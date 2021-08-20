import {MenuItem} from 'primeng/api';
import {map} from 'rxjs/operators';

export const menuItemsDecoratorFn: (itemsA: MenuItem[], store$) => MenuItem[] = (itemsA: MenuItem[], store$) => {
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

export const menuItemsDecorator = (store$: any) => {
  return input$ => input$.pipe(
    map((items: MenuItem[]) => {
      return menuItemsDecoratorFn(items, store$);
    })
  );
};
