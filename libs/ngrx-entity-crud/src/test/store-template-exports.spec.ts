import {readFileSync} from 'fs';
import {join} from 'path';
import {strings, template} from '@angular-devkit/core';
import {createCrudEntityAdapter} from '../lib/create_adapter';

/**
 * I template dello schematic `store` ri-esportano per nome le azioni e i selettori creati dalle
 * factory della libreria (`export const {...} = actions`). Quando la libreria aggiunge un membro
 * (es. `Restore*`), il template va aggiornato a mano: questi test lo rendono con lo stesso motore
 * EJS di Angular schematics e confrontano i nomi esportati con quelli reali delle factory.
 */

const PLURAL_DIR = '../../schematics/store/files/crud-store/plural/__clazz@dasherize__-store';

const SINGULAR_DIR = '../../schematics/store/files/crud-store/singular/__clazz@dasherize__-store';

function render(file: string, options: Record<string, unknown>, dir: string = PLURAL_DIR): string {
  const source = readFileSync(join(__dirname, dir, file), 'utf-8');
  return template(source)({...strings, clazz: 'Coin', type: 'CRUD-PLURAL', persist: false, ...options});
}

/** Nomi destrutturati in `export const { A, B, ... } = <source>;`. */
function destructuredNames(code: string, source: string): string[] {
  const match = code.match(new RegExp(`export const \\{([^}]*)\\}\\s*=\\s*${source}`));
  expect(match).not.toBeNull();
  return (match as RegExpMatchArray)[1]
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

describe('store schematic — template plural', () => {
  interface Coin {
    id: string;
  }

  const adapter = createCrudEntityAdapter<Coin>({selectId: (c) => c.id});

  it('actions.ts esporta tutte le azioni di createCrudActions', () => {
    const exported = destructuredNames(render('__clazz@dasherize__.actions.ts', {}), 'actions');
    const factory = Object.keys(adapter.createCrudActions('coin'));

    expect(exported.sort()).toEqual(factory.sort());
  });

  it('actions.ts non dipende dalla persistenza (le sue azioni stanno nel bundle <Clazz>Persistence)', () => {
    const code = render('__clazz@dasherize__.actions.ts', {persist: true});

    expect(code).not.toContain('ngrx-entity-crud/persistence');
  });

  describe('persistenza sempre cablata, --persist decide solo enabled', () => {
    const PERSISTENCE_DIR = '../../schematics/store/files/crud-persistence/__clazz@dasherize__-store';

    it.each([
      [false, 'enabled: false'],
      [true, 'enabled: true'],
    ])('persistence.ts con --persist=%s crea il bundle con %s', (persist, expected) => {
      const code = render('__clazz@dasherize__.persistence.ts', {persist}, PERSISTENCE_DIR);

      expect(code).toContain('import {createPersistence} from \'ngrx-entity-crud/persistence\';');
      expect(code).toMatch(/export const CoinPersistence = createPersistence<Coin>\(\{/);
      expect(code).toContain('feature: Names.NAME');
      expect(code).toContain('selectId: Coin.selectId');
      expect(code).toContain(expected);
    });

    it.each([false, true])('store.module.ts registra reducer ed effects del bundle anche con --persist=%s', (persist) => {
      const code = render('__clazz@dasherize__-store.module.ts', {persist});

      expect(code).toContain('import {CoinPersistence} from \'./coin.persistence\';');
      expect(code).toContain('StoreModule.forFeature(CoinPersistence.featureKey, CoinPersistence.reducer)');
      expect(code).toMatch(/EffectsModule\.forFeature\(\[CoinStoreEffects, CoinPersistence\.effects\]\)/);
      expect(code).not.toContain('createPersistenceEffects');
    });

    it.each(['index.ts', 'index.d.ts'])('%s esporta CoinPersistence', (file) => {
      expect(render(file, {})).toContain('export {CoinPersistence} from \'./coin.persistence\';');
    });
  });

  it('selectors.ts esporta tutti i selettori di getCrudSelectors', () => {
    const exported = destructuredNames(
      render('__clazz@dasherize__.selectors.ts', {}),
      'adapter\\.getCrudSelectors'
    );
    const factory = Object.keys(adapter.getCrudSelectors((state: any) => state));

    expect(exported.sort()).toEqual(factory.sort());
  });
});

describe('store schematic — template singular', () => {
  /**
   * Membri di `SingularActions<T>` (src/lib/models.ts): non esiste una factory singolare da cui
   * leggerli a runtime, l'elenco segue l'interfaccia.
   */
  const SINGULAR_ACTIONS = [
    'Response',
    'ResetResponses',
    'SelectRequest',
    'SelectFailure',
    'SelectSuccess',
    'EditRequest',
    'EditFailure',
    'EditSuccess',
    'Reset',
    'Edit',
    'SelectItem',
  ];

  it('actions.ts esporta tutte le azioni di SingularActions', () => {
    const exported = destructuredNames(render('__clazz@dasherize__.actions.ts', {}, SINGULAR_DIR), 'actions');

    expect(exported.sort()).toEqual([...SINGULAR_ACTIONS].sort());
  });
});
