import {
  selectError,
  selectErrors,
  selectIsLoading,
  selectLoadingNames,
} from '../../schematics/ng-add/files/src/app/root-store/selectors';

/**
 * Selettori agnostici generati da `ng add` (`root-store/selectors.ts`): il file del template non
 * contiene sintassi EJS, quindi si testa direttamente il comportamento.
 */
describe('ng-add root-store selectors', () => {
  it('selectIsLoading/selectLoadingNames: considera solo le slice con isLoading booleano', () => {
    const state = {
      coin: {isLoading: true, error: null},
      pizza: {isLoading: false, error: null},
      router: {state: {}},
    };

    expect(selectLoadingNames(state)).toEqual(['coin']);
    expect(selectIsLoading(state)).toBe(true);
  });

  it('selectErrors: mantiene gli errori stringa e ignora null/stringa vuota', () => {
    const state = {
      coin: {isLoading: false, error: 'boom'},
      pizza: {isLoading: false, error: null},
      beer: {isLoading: false, error: ''},
    };

    expect(selectErrors(state)).toEqual(['boom']);
  });

  it('selectErrors: normalizza gli errori oggetto (es. HttpErrorResponse dal catchError degli effect) nel loro message', () => {
    const state = {
      coin: {isLoading: false, error: {name: 'HttpErrorResponse', message: 'Http failure response: 500'}},
    };

    expect(selectErrors(state)).toEqual(['Http failure response: 500']);
    expect(selectError(state)).toBe('Http failure response: 500');
  });

  it('selectErrors: un errore oggetto senza message viene reso come stringa', () => {
    const state = {coin: {isLoading: false, error: {code: 42}}};

    expect(selectErrors(state)).toHaveLength(1);
    expect(typeof selectErrors(state)[0]).toBe('string');
  });
});
