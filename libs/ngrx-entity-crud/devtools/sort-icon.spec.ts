import { necSortIconClass } from './sort-icon';

describe('necSortIconClass', () => {
  it('colonna non ordinata -> pi-sort-alt', () => {
    expect(necSortIconClass({ sortField: 'other', sortOrder: 1 }, 'key')).toBe(
      'pi-sort-alt'
    );
    expect(necSortIconClass({}, 'key')).toBe('pi-sort-alt');
    expect(necSortIconClass({ sortField: null, sortOrder: 1 }, 'key')).toBe(
      'pi-sort-alt'
    );
  });

  it('colonna ordinata ascendente -> pi-sort-amount-up-alt', () => {
    expect(necSortIconClass({ sortField: 'key', sortOrder: 1 }, 'key')).toBe(
      'pi-sort-amount-up-alt'
    );
  });

  it('colonna ordinata discendente -> pi-sort-amount-down', () => {
    expect(necSortIconClass({ sortField: 'key', sortOrder: -1 }, 'key')).toBe(
      'pi-sort-amount-down'
    );
  });

  it('sortOrder 0 (sort rimosso) -> pi-sort-alt, come il SortIcon di PrimeNG 16', () => {
    expect(necSortIconClass({ sortField: 'key', sortOrder: 0 }, 'key')).toBe(
      'pi-sort-alt'
    );
  });
});
