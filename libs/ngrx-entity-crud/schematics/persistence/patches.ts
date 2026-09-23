import {strings} from '@angular-devkit/core';
import * as ts from 'typescript/lib/tsserverlibrary';

/**
 * Modifiche dello schematic `persistence` come funzioni pure sul testo dei file (testabili senza
 * l'engine degli schematics). Ogni funzione e' idempotente: rieseguirla non cambia nulla.
 *
 * Quando un file e' stato modificato a mano e il punto d'aggancio non si trova, la funzione NON
 * indovina: inserisce un marcatore che non compila (identificatore non dichiarato in TypeScript,
 * elemento sconosciuto nei template Angular) e lo elenca in `manual`. `ng build` fallisce proprio
 * li', con un nome che dice cosa completare.
 */
export interface PatchResult {
  content: string;
  /** Modifiche applicate (per il log dello schematic). */
  applied: string[];
  /** Passi da completare a mano: per ognuno c'e' un marcatore che non compila nel file. */
  manual: string[];
}

const HEADER = 'ngrx-entity-crud:persistence';

function slug(text: string, separator: string): string {
  return text
    .replace(/[^A-Za-z0-9]+/g, separator)
    .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '');
}

function manualStepTsId(step: string): string {
  return `NEC_PASSO_MANUALE__${slug(step, '_')}`;
}

function manualStepHtmlTag(step: string): string {
  return `nec-passo-manuale-${slug(step, '-').toLowerCase()}`;
}

/** Marcatore TypeScript: sintassi valida, ma l'identificatore non esiste (TS2304 in compilazione). */
export function manualStepTs(step: string): string {
  return (
    `// ${HEADER} — PASSO MANUALE: ${step}.\n` +
    '// Questa riga non compila apposta: completa il passo a mano, poi cancellala.\n' +
    `${manualStepTsId(step)};\n`
  );
}

/** Marcatore per i template: elemento sconosciuto, errore NG8001 in compilazione. */
export function manualStepHtml(step: string): string {
  const tag = manualStepHtmlTag(step);
  return (
    `<!-- ${HEADER} — PASSO MANUALE: ${step}. ` +
    'L\'elemento qui sotto non compila apposta (NG8001): completa il passo a mano, poi cancellalo. -->\n' +
    `<${tag}></${tag}>\n`
  );
}

function parse(content: string): ts.SourceFile {
  return ts.createSourceFile('file.ts', content, ts.ScriptTarget.Latest, true);
}

function insertAt(content: string, pos: number, text: string): string {
  return content.slice(0, pos) + text + content.slice(pos);
}

function lastImportEnd(content: string): number {
  const imports = parse(content).statements.filter(ts.isImportDeclaration);
  return imports.length ? imports[imports.length - 1].getEnd() : 0;
}

function addImportLine(content: string, line: string): string {
  if (content.includes(line)) {
    return content;
  }
  const end = lastImportEnd(content);
  return end === 0 ? `${line}\n${content}` : insertAt(content, end, `\n${line}`);
}

function addManualStepTs(result: PatchResult, step: string): void {
  result.manual.push(step);
  if (result.content.includes(manualStepTsId(step))) {
    return;
  }
  const end = lastImportEnd(result.content);
  result.content = end === 0
    ? `${manualStepTs(step)}\n${result.content}`
    : insertAt(result.content, end, `\n\n${manualStepTs(step)}`);
}

function findNode<T extends ts.Node>(content: string, predicate: (node: ts.Node) => node is T): T | undefined {
  let found: T | undefined;
  const visit = (node: ts.Node): void => {
    if (!found && predicate(node)) {
      found = node;
      return;
    }
    if (!found) {
      ts.forEachChild(node, visit);
    }
  };
  visit(parse(content));
  return found;
}

/** Array letterale `prop: [...]` dentro `@NgModule({...})`. */
function findNgModuleArray(content: string, prop: string): ts.ArrayLiteralExpression | undefined {
  const decorator = findNode(content, (node): node is ts.Decorator =>
    ts.isDecorator(node) &&
    ts.isCallExpression(node.expression) &&
    node.expression.expression.getText() === 'NgModule'
  );
  const arg = decorator && (decorator.expression as ts.CallExpression).arguments[0];
  if (!arg || !ts.isObjectLiteralExpression(arg)) {
    return undefined;
  }
  const property = arg.properties.find((p): p is ts.PropertyAssignment =>
    ts.isPropertyAssignment(p) && p.name.getText() === prop
  );
  return property && ts.isArrayLiteralExpression(property.initializer) ? property.initializer : undefined;
}

function indentOf(content: string, pos: number): string {
  const lineStart = content.lastIndexOf('\n', pos - 1) + 1;
  return content.slice(lineStart, pos).match(/^\s*/)?.[0] ?? '';
}

/** Aggiunge `element` all'array, su una nuova riga dopo `after` (o dopo l'ultimo elemento). */
function appendToArrayOnNewLine(content: string, array: ts.ArrayLiteralExpression, element: string, after?: ts.Expression): string {
  const anchor = after ?? array.elements[array.elements.length - 1];
  if (!anchor) {
    return insertAt(content, array.getStart() + 1, element);
  }
  return insertAt(content, anchor.getEnd(), `,\n${indentOf(content, anchor.getStart())}${element}`);
}

/**
 * `xxx-store.module.ts`: importa `<Clazz>Persistence` e ne registra reducer (`StoreModule.forFeature`)
 * ed effects (`EffectsModule.forFeature`).
 */
export function patchStoreModule(content: string, clazz: string): PatchResult {
  const bundle = `${clazz}Persistence`;
  const dash = strings.dasherize(clazz);
  const result: PatchResult = {content, applied: [], manual: []};

  if (/\bcreatePersistence(Effects|Reducer)\b/.test(content)) {
    // Cablaggio delle beta precedenti (--persist): aggiungerne un secondo registrerebbe due volte
    // gli effect della stessa feature (scritture doppie). Va migrato a mano.
    addManualStepTs(
      result,
      'rimuovi il vecchio cablaggio createPersistenceEffects/createPersistenceReducer/createPersistenceSelectors ' +
      `e registra ${bundle}.reducer e ${bundle}.effects (vedi ${dash}.persistence.ts)`
    );
    return result;
  }

  result.content = addImportLine(result.content, `import {${bundle}} from './${dash}.persistence';`);

  if (!result.content.includes(`${bundle}.reducer`)) {
    const imports = findNgModuleArray(result.content, 'imports');
    if (imports) {
      const storeForFeature = imports.elements.find((e) => e.getText().startsWith('StoreModule.forFeature('));
      result.content = appendToArrayOnNewLine(
        result.content,
        imports,
        `StoreModule.forFeature(${bundle}.featureKey, ${bundle}.reducer)`,
        storeForFeature
      );
      result.applied.push(`reducer di ${bundle} registrato in StoreModule.forFeature`);
    } else {
      addManualStepTs(result, `registra StoreModule.forFeature(${bundle}.featureKey, ${bundle}.reducer) negli imports del NgModule`);
    }
  }

  if (!result.content.includes(`${bundle}.effects`)) {
    const call = findNode(result.content, (node): node is ts.CallExpression =>
      ts.isCallExpression(node) &&
      node.expression.getText() === 'EffectsModule.forFeature' &&
      node.arguments.length > 0 &&
      ts.isArrayLiteralExpression(node.arguments[0])
    );
    if (call) {
      const array = call.arguments[0] as ts.ArrayLiteralExpression;
      const last = array.elements[array.elements.length - 1];
      result.content = last
        ? insertAt(result.content, last.getEnd(), `, ${bundle}.effects`)
        : insertAt(result.content, array.getStart() + 1, `${bundle}.effects`);
      result.applied.push(`effects di ${bundle} registrati in EffectsModule.forFeature`);
    } else {
      addManualStepTs(result, `registra ${bundle}.effects in EffectsModule.forFeature`);
    }
  }

  return result;
}

/** `index.ts` dello store: esporta `<Clazz>Persistence` (arriva cosi' anche a `@root-store/index`). */
export function patchStoreIndex(content: string, clazz: string): PatchResult {
  const line = `export {${clazz}Persistence} from './${strings.dasherize(clazz)}.persistence';`;
  if (content.includes(line)) {
    return {content, applied: [], manual: []};
  }
  const separator = content.endsWith('\n') ? '' : '\n';
  return {content: `${content}${separator}\n${line}\n`, applied: [`export di ${clazz}Persistence`], manual: []};
}

/** Modulo della sezione: importa `NecRestoreSearchComponent` (standalone) negli imports del NgModule. */
export function patchSectionModule(content: string, _clazz: string): PatchResult {
  const component = 'NecRestoreSearchComponent';
  const result: PatchResult = {content, applied: [], manual: []};
  result.content = addImportLine(result.content, `import {${component}} from 'ngrx-entity-crud/persistence-ui';`);

  const imports = findNgModuleArray(result.content, 'imports');
  if (!imports) {
    addManualStepTs(result, `aggiungi ${component} agli imports del NgModule della sezione`);
  } else if (!imports.elements.some((e) => e.getText() === component)) {
    result.content = appendToArrayOnNewLine(result.content, imports, component);
    result.applied.push(`${component} aggiunto agli imports del modulo della sezione`);
  }
  return result;
}

/** Componente main della sezione: proprieta' `persistence = <Clazz>Persistence` per il template. */
export function patchMainComponentTs(content: string, clazz: string): PatchResult {
  const bundle = `${clazz}Persistence`;
  const property = `persistence = ${bundle};`;
  if (content.includes(property)) {
    return {content, applied: [], manual: []};
  }
  const result: PatchResult = {content, applied: [], manual: []};
  result.content = addImportLine(result.content, `import {${bundle}} from '@root-store/index';`);

  const className = `${clazz}MainComponent`;
  const declaration = findNode(result.content, (node): node is ts.ClassDeclaration =>
    ts.isClassDeclaration(node) && node.name?.getText() === className
  );
  const openBrace = declaration?.getChildren().find((child) => child.kind === ts.SyntaxKind.OpenBraceToken);
  if (openBrace) {
    result.content = insertAt(result.content, openBrace.getEnd(), `\n\n  ${property}`);
    result.applied.push(`proprieta' persistence aggiunta a ${className}`);
  } else {
    addManualStepTs(result, `aggiungi la proprieta ${property} al componente main della sezione (${className} non trovato)`);
  }
  return result;
}

const APP_SEARCH = /<app-search\b[^>]*?(?:\/>|>[\s\S]*?<\/app-search>)/g;

/** Template del main: avvolge `<app-search>` con `<nec-restore-search [persistence]="persistence">`. */
export function patchMainComponentHtml(content: string): PatchResult {
  if (content.includes('<nec-restore-search')) {
    return {content, applied: [], manual: []};
  }
  const matches = content.match(APP_SEARCH) ?? [];
  if (matches.length === 1) {
    const [search] = matches;
    const start = content.indexOf(search);
    const indent = indentOf(content, start);
    const wrapped =
      '<nec-restore-search [persistence]="persistence">\n' +
      `${indent}  ${search}\n` +
      `${indent}</nec-restore-search>`;
    return {
      content: content.slice(0, start) + wrapped + content.slice(start + search.length),
      applied: ['<app-search> avvolto con <nec-restore-search>'],
      manual: [],
    };
  }

  const step = 'avvolgi il pulsante di ricerca con nec-restore-search [persistence]="persistence"';
  const reason = matches.length === 0 ? '<app-search> non trovato' : `${matches.length} <app-search> trovati`;
  const tag = manualStepHtmlTag(step);
  return {
    content: content.includes(`<${tag}>`) ? content : `${manualStepHtml(step)}${content}`,
    applied: [],
    manual: [`${step} (${reason})`],
  };
}
