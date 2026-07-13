import {necClassify, necDasherize, NecScaffoldComponent, NecScaffoldField} from './nec-scaffold.component';

/** Narrowing senza non-null assertion (vietata dal lint): fallisce il test se il campo manca. */
function fieldOrFail(component: NecScaffoldComponent, name: string): NecScaffoldField {
  const field = component.fields().find((f) => f.name === name);
  expect(field).toBeDefined();
  return field as NecScaffoldField;
}

/**
 * Il componente non inietta servizi: si testa istanziandolo direttamente, senza TestBed.
 * Le funzioni di naming sono il CONTRATTO col flusso schematics: `view` risolve il conf da
 * `strings.dasherize(classify(clazz))`, quindi le repliche browser-side devono coincidere
 * con `@angular-devkit/core`.
 */
describe('nec-scaffold — naming (parità con @angular-devkit/core strings)', () => {
  it('necClassify normalizza spazi, trattini e underscore', () => {
    expect(necClassify('product browser')).toBe('ProductBrowser');
    expect(necClassify('product-browser')).toBe('ProductBrowser');
    expect(necClassify('product_browser')).toBe('ProductBrowser');
    expect(necClassify('ProductBrowser')).toBe('ProductBrowser');
    expect(necClassify('updateLog')).toBe('UpdateLog');
  });

  it('necDasherize produce il nome file atteso dallo schematic view', () => {
    expect(necDasherize('ProductBrowser')).toBe('product-browser');
    expect(necDasherize('UpdateLog')).toBe('update-log');
    expect(necDasherize('Coin')).toBe('coin');
  });

  it('stringa vuota resta vuota (nessun file/comando suggerito)', () => {
    expect(necClassify('')).toBe('');
    expect(necDasherize('')).toBe('');
  });
});

describe('NecScaffoldComponent — derivazione campi dal DTO', () => {
  let component: NecScaffoldComponent;

  beforeEach(() => {
    component = new NecScaffoldComponent();
  });

  it('deriva i campi con i tipi della logica typeOf dello schematic', () => {
    component.setDto('{"id": "abc", "key": 0, "version": 0, "name": "x", "tags": [], "meta": {}, "gone": null}');

    expect(component.dtoError()).toBeNull();
    const byName = new Map(component.fields().map((f) => [f.name, f]));
    expect(byName.get('id')?.dtoType).toBe('string');
    expect(byName.get('key')?.dtoType).toBe('number');
    expect(byName.get('tags')?.dtoType).toBe('array');
    expect(byName.get('meta')?.dtoType).toBe('object');
    expect(byName.get('gone')?.dtoType).toBe('null');
  });

  it('default: id è key, i numerici cercano come number, gli altri come string', () => {
    component.setDto('{"id": "abc", "amount": 3, "name": "x"}');

    const byName = new Map(component.fields().map((f) => [f.name, f]));
    expect(byName.get('id')?.isKey).toBe(true);
    expect(byName.get('amount')?.isKey).toBe(false);
    expect(byName.get('amount')?.searchType).toBe('number');
    expect(byName.get('name')?.searchType).toBe('string');
    // nessun campo entra in ricerca senza scelta esplicita
    expect(component.searchCount()).toBe(0);
  });

  it('JSON invalido: segnala l\'errore e NON tocca i campi già derivati', () => {
    component.setDto('{"id": "abc"}');
    expect(component.fields().length).toBe(1);

    component.setDto('{"id": "abc"'); // parentesi mancante: stato transitorio di digitazione
    expect(component.dtoError()).toContain('Invalid JSON');
    expect(component.fields().length).toBe(1);
    expect(component.dtoObject()).toEqual({id: 'abc'});
  });

  it('array o primitivo: errore dedicato (serve un singolo oggetto)', () => {
    component.setDto('[{"id": 1}]');
    expect(component.dtoError()).toContain('single JSON object');

    component.setDto('42');
    expect(component.dtoError()).toContain('single JSON object');
  });

  it('svuotare la textarea rimuove i campi DTO ma conserva i manuali', () => {
    component.setDto('{"id": "abc"}');
    component.setNewFieldName('startDate');
    component.addManualField();

    component.setDto('   ');
    expect(component.dtoError()).toBeNull();
    expect(component.fields().map((f) => f.name)).toEqual(['startDate']);
    expect(component.dtoObject()).toBeNull();
  });

  it('ri-incollare il DTO conserva le scelte fatte sui campi esistenti', () => {
    component.setDto('{"id": "abc", "name": "x"}');
    const name = fieldOrFail(component, 'name');
    component.toggleSearch(name);
    component.cycleSearchType({...name, inSearch: true});

    component.setDto('{"id": "abc", "name": "x", "extra": 1}');
    const after = component.fields().find((f) => f.name === 'name');
    expect(after?.inSearch).toBe(true);
    expect(after?.searchType).toBe('number'); // string -> number dopo un cycle
    expect(component.fields().some((f) => f.name === 'extra')).toBe(true);
  });

  it('un campo manuale che compare nel DTO viene promosso a campo DTO', () => {
    component.setNewFieldName('name');
    component.addManualField();
    component.setDto('{"id": "abc", "name": "x"}');

    const name = component.fields().find((f) => f.name === 'name');
    expect(name?.origin).toBe('dto');
    expect(name?.inSearch).toBe(true); // scelta manuale conservata
    expect(component.fields().filter((f) => f.name === 'name').length).toBe(1);
  });
});

describe('NecScaffoldComponent — campi manuali e toggle', () => {
  let component: NecScaffoldComponent;

  beforeEach(() => {
    component = new NecScaffoldComponent();
  });

  it('addManualField aggiunge un campo di sola ricerca e rifiuta i duplicati', () => {
    component.setNewFieldName('startDate');
    component.addManualField();
    expect(component.fields()).toEqual([
      {name: 'startDate', dtoType: '', searchType: 'string', isKey: false, inSearch: true, origin: 'manual'},
    ]);
    expect(component.newFieldName()).toBe('');

    component.setNewFieldName('startDate');
    component.addManualField();
    expect(component.fieldError()).toContain('already listed');
    expect(component.fields().length).toBe(1);
  });

  it('nome vuoto o solo spazi: nessun campo aggiunto', () => {
    component.setNewFieldName('   ');
    component.addManualField();
    expect(component.fields().length).toBe(0);
  });

  it('removeField rimuove solo il campo manuale indicato', () => {
    component.setDto('{"id": "abc"}');
    component.setNewFieldName('startDate');
    component.addManualField();

    component.removeField(fieldOrFail(component, 'startDate'));
    expect(component.fields().map((f) => f.name)).toEqual(['id']);

    // un campo DTO non è rimovibile da qui (si corregge il JSON)
    component.removeField(component.fields()[0]);
    expect(component.fields().length).toBe(1);
  });

  it('toggleKey è un no-op sui campi manuali (selectId legge il DTO)', () => {
    component.setNewFieldName('startDate');
    component.addManualField();
    component.toggleKey(component.fields()[0]);
    expect(component.fields()[0].isKey).toBe(false);
  });

  it('cycleSearchType cicla string → number → date → string', () => {
    component.setDto('{"name": "x"}');
    const field = () => component.fields()[0];
    expect(field().searchType).toBe('string');
    component.cycleSearchType(field());
    expect(field().searchType).toBe('number');
    component.cycleSearchType(field());
    expect(field().searchType).toBe('date');
    component.cycleSearchType(field());
    expect(field().searchType).toBe('string');
  });
});

describe('NecScaffoldComponent — conf generato e comandi', () => {
  let component: NecScaffoldComponent;

  beforeEach(() => {
    component = new NecScaffoldComponent();
    component.setClazz('product browser');
    component.setDto('{"id": "abc", "key": 0, "version": 0, "name": "x"}');
  });

  it('deriva classify/dasherize e il percorso del conf', () => {
    expect(component.classified()).toBe('ProductBrowser');
    expect(component.confFileName()).toBe('product-browser.json');
    expect(component.confPath()).toBe('grm-schematics/conf/product-browser.json');
  });

  it('genera il conf con la forma consumata da getOptions() dello schematic view', () => {
    const name = fieldOrFail(component, 'name');
    component.toggleSearch(name);

    expect(component.buildConf()).toEqual({
      formAttributes: [],
      dtoObject: {id: 'abc', key: 0, version: 0, name: 'x'},
      keys: ['id'],
      conditionMap: {
        'product-browser': {
          conditions: [
            {fieldName: 'name', fieldValue: null, operator: null, type: 'string', enabled: false},
          ],
          conditionsLog: [],
        },
      },
    });
  });

  it('confText è il JSON pretty-printed del conf', () => {
    expect(JSON.parse(component.confText())).toEqual(component.buildConf());
    expect(component.confText()).toContain('\n  "formAttributes": []');
  });

  it('il nome sezione esplicito sostituisce quello derivato', () => {
    component.setSectionName('anagrafica');
    expect(Object.keys(component.buildConf().conditionMap)).toEqual(['anagrafica']);
  });

  it('più keys: tutte presenti nell\'ordine dei campi', () => {
    const key = fieldOrFail(component, 'key');
    component.toggleKey(key);
    expect(component.buildConf().keys).toEqual(['id', 'key']);
  });

  it('comandi nell\'ordine store → view coi default, api solo se configurato', () => {
    expect(component.commands().map((c) => c.command)).toEqual([
      'ng generate ngrx-entity-crud:store --clazz ProductBrowser',
      'ng generate grm-schematics:view --clazz ProductBrowser',
    ]);

    component.apiSchematic = 'grm-schematics:api';
    expect(component.commands().map((c) => c.command)).toEqual([
      'ng generate ngrx-entity-crud:store --clazz ProductBrowser',
      'ng generate grm-schematics:api --clazz ProductBrowser',
      'ng generate grm-schematics:view --clazz ProductBrowser',
    ]);
  });

  it('schematic azzerato = comando nascosto; senza clazz nessun comando', () => {
    component.storeSchematic = '';
    expect(component.commands().map((c) => c.command)).toEqual([
      'ng generate grm-schematics:view --clazz ProductBrowser',
    ]);

    component.setClazz('');
    expect(component.commands()).toEqual([]);
    expect(component.confPath()).toBe('');
  });

  it('confDir custom (anche con slash finale) si riflette nel percorso', () => {
    component.confDir = 'tools/conf/';
    expect(component.confPath()).toBe('tools/conf/product-browser.json');
  });

  it('confDir vuoto: solo il nome file, niente path assoluto', () => {
    component.confDir = '';
    expect(component.confPath()).toBe('product-browser.json');
  });
});
