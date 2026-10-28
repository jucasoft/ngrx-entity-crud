import { necAllSelected, necToggleAll, necToggleItem } from './selection';

describe('selezione righe (dialog form-clipboard)', () => {
  const all = ['a', 'b', 'c'];

  it('necToggleItem deseleziona e riseleziona mantenendo l\'ordine di all', () => {
    expect(necToggleItem(all, all, 'b')).toEqual(['a', 'c']);
    expect(necToggleItem(all, ['c', 'a'], 'b')).toEqual(['a', 'b', 'c']);
    expect(necToggleItem(all, [], 'c')).toEqual(['c']);
  });

  it('necToggleAll: tutto selezionato -> nessuno, altrimenti tutti', () => {
    expect(necToggleAll(all, ['a', 'b', 'c'])).toEqual([]);
    expect(necToggleAll(all, ['b'])).toEqual(['a', 'b', 'c']);
    expect(necToggleAll(all, [])).toEqual(['a', 'b', 'c']);
  });

  it('necToggleAll restituisce una copia, non all', () => {
    expect(necToggleAll(all, [])).not.toBe(all);
  });

  it('necAllSelected e\' vero solo con almeno una riga e tutte selezionate', () => {
    expect(necAllSelected(all, ['c', 'b', 'a'])).toBe(true);
    expect(necAllSelected(all, ['a'])).toBe(false);
    expect(necAllSelected([], [])).toBe(false);
  });
});
