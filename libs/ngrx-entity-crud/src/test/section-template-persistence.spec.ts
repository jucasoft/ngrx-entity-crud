import {readFileSync} from 'fs';
import {join} from 'path';
import {strings, template} from '@angular-devkit/core';

/**
 * Lo schematic `section` genera la UI gia' collegata alla persistenza della sezione
 * (`<Clazz>Persistence`, sempre presente negli store CRUD-PLURAL): con `enabled: false`
 * `<nec-restore-search>` e' trasparente, quindi la sezione si comporta come prima.
 */
const SECTION_DIR = '../../schematics/section/files/primeng/plural/__clazz@dasherize__';

function render(file: string): string {
  const source = readFileSync(join(__dirname, SECTION_DIR, file), 'utf-8');
  return template(source)({...strings, clazz: 'Coin'});
}

describe('section template — persistenza', () => {
  it('main.component.html avvolge <app-search> con <nec-restore-search [persistence]>', () => {
    const html = render('__clazz@dasherize__-main/__clazz@dasherize__-main.component.html');

    expect(html).toMatch(
      /<nec-restore-search \[persistence\]="persistence">\s*<app-search \[actions\]="actions"><\/app-search>\s*<\/nec-restore-search>/
    );
  });

  it('main.component.ts espone il bundle CoinPersistence dello store', () => {
    const code = render('__clazz@dasherize__-main/__clazz@dasherize__-main.component.ts');

    expect(code).toMatch(/import \{[^}]*CoinPersistence[^}]*\} from '@root-store\/index';/);
    expect(code).toContain('persistence = CoinPersistence;');
  });

  it('il modulo della sezione importa NecRestoreSearchComponent da ngrx-entity-crud/persistence-ui', () => {
    const code = render('__clazz@dasherize__.module.ts');

    expect(code).toContain('import {NecRestoreSearchComponent} from \'ngrx-entity-crud/persistence-ui\';');
    expect(code).toMatch(/imports: \[[\s\S]*NecRestoreSearchComponent[\s\S]*\]/);
  });

  it('la lista cerca all\'apertura con CoinPersistence.actions.InitialSearch, non con SearchRequest (che cancellerebbe i dati locali)', () => {
    const code = render('__clazz@dasherize__-list/__clazz@dasherize__-list.component.ts');

    expect(code).toMatch(/import \{[^}]*CoinPersistence[^}]*\} from '@root-store\/index';/);
    expect(code).toContain('CoinPersistence.actions.InitialSearch({queryParams: {}})');
    expect(code).not.toContain('SearchRequest(');
  });
});
