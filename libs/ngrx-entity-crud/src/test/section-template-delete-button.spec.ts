import {readFileSync} from 'fs';
import {join} from 'path';

/**
 * Il template del pulsante delete generato da `ngrx-entity-crud:section` contiene sintassi EJS
 * (`<%= clazz %>`), quindi non e' eseguibile qui: si verifica il sorgente del template.
 *
 * `selectItemsSelectedOrigin` mappa `idsSelected -> entities[id]` e restituisce `undefined` per un
 * id selezionato che non e' (piu') in `entities`: un `DeleteManyRequest` con `undefined` in
 * `mutationParams` finirebbe in un TypeError dentro `getId()`. Il selector del core NON va
 * cambiato (altri consumer ne usano la lunghezza), il filtro sta nel componente generato.
 */
describe('section template — button-delete', () => {
  const templatePath = join(
    __dirname,
    '../../schematics/section/files/primeng/plural/__clazz@dasherize__/components/button-delete-__clazz@dasherize__.component.ts'
  );
  const source = readFileSync(templatePath, 'utf-8');

  it('legge la selezione dallo store tramite selectItemsSelectedOrigin', () => {
    expect(source).toMatch(/select\(<%= clazz %>StoreSelectors\.selectItemsSelectedOrigin\)/);
  });

  it('scarta gli elementi selezionati non presenti in entities prima di usarli per il delete', () => {
    const pipe = source.slice(source.indexOf('selectItemsSelectedOrigin'));
    expect(pipe).toMatch(/^selectItemsSelectedOrigin\)\s*,\s*map\(\s*\(?items[^)]*\)?\s*=>\s*\(?items\s*\|\|\s*\[\]\)?\.filter\(/);
  });
});
