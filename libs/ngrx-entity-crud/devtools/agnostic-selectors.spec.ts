import {createAgnosticLoadingSelectors} from './agnostic-selectors';

describe('createAgnosticLoadingSelectors', () => {
  const state = {
    a: {isLoading: true, error: ''},
    b: {isLoading: false, error: 'oops'},
    c: {nope: 1}, // non è una slice CRUD (manca isLoading boolean) -> ignorata
    d: {isLoading: true, error: 'bad'},
  };

  it('selectLoadingNames elenca solo le slice in caricamento', () => {
    const sel = createAgnosticLoadingSelectors();
    expect(sel.selectLoadingNames(state)).toEqual(['a', 'd']);
  });

  it('selectIsLoading è true se almeno una slice è in caricamento', () => {
    const sel = createAgnosticLoadingSelectors();
    expect(sel.selectIsLoading(state)).toBe(true);
    expect(sel.selectIsLoading({x: {isLoading: false, error: ''}})).toBe(false);
  });

  it('selectErrors/selectError raccolgono gli errori non vuoti', () => {
    const sel = createAgnosticLoadingSelectors();
    expect(sel.selectErrors(state)).toEqual(['oops', 'bad']);
    expect(sel.selectError(state)).toBe('oops\nbad');
  });

  it('rispetta whitelist e blacklist', () => {
    const wl = createAgnosticLoadingSelectors({whitelist: ['a']});
    expect(wl.selectLoadingNames(state)).toEqual(['a']);

    const bl = createAgnosticLoadingSelectors({blacklist: ['a']});
    expect(bl.selectLoadingNames(state)).toEqual(['d']);
  });

  it('supporta un rootSelector verso un feature-state', () => {
    const sel = createAgnosticLoadingSelectors({rootSelector: (s: any) => s.feature});
    expect(sel.selectLoadingNames({feature: {x: {isLoading: true, error: ''}}})).toEqual(['x']);
  });
});
