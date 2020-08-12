import {apply, mergeWith, move, Rule, SchematicContext, SchematicsException, template, Tree, url} from '@angular-devkit/schematics';
import {normalize, strings} from '@angular-devkit/core';
import * as ts from 'typescript/lib/tsserverlibrary';
import * as merge from 'deepmerge';
import {ModuleOptions} from '@schematics/angular/utility/find-module';
import {InsertChange} from '@schematics/angular/utility/change';
import {addImportToModule, addRouteDeclarationToModule} from '@schematics/angular/utility/ast-utils';

/**
 * Aggiunge l'export nell'index.ts e index.d.ts
 */
export function addExport(options: { clazz: string }, file: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const content: Buffer | null = tree.read(file);
    let strContent: string = '';
    if (content) {
      strContent = content.toString();
    }

    const dirName = `${strings.dasherize(options.clazz)}-store`;

    const updatedContent = strContent.concat('\nexport * from \'./' + dirName + '\';');
    tree.overwrite(file, updatedContent);
    return tree;
  };
}

/**
 * Aggiorna l'interfaccia dell'interfaccia
 */
export function updateState(options: { name: string, clazz: string }, file: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const content: Buffer | null = tree.read(file);
    let strContent: string = '';
    if (content) {
      strContent = content.toString();
    }
    const startIndex = strContent.indexOf('export');
    const endIndex = strContent.indexOf('{', startIndex);
    const newLine = `${strings.underscore(options.name)}:${options.clazz}StoreState.State;`;
    strContent = strContent.slice(0, endIndex + 1) + '\n' + newLine + strContent.slice(endIndex + 1);
    tree.overwrite(file, strContent);
    return tree;
  };
}

/**
 * Aggiunge l'import nella parte del file.
 */
export function addImport(file: string, importString: string): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    const content: Buffer | null = tree.read(file);
    let strContent: string = '';
    if (content) {
      strContent = content.toString();
    }
    strContent = importString + '\n' + strContent;
    tree.overwrite(file, strContent);
    return tree;
  };
}

/**
 * Aggiunge al selettore principale RootSelector, i riferimenti allo store appena creato.
 */
export function addRootSelector(options: { clazz: string }, file: string): Rule {
  return (tree: Tree) => {
    const content: Buffer | null = tree.read(file);
    let strContent: string = '';
    if (content) {
      strContent = content.toString();
    }
    strContent = addLine(strContent, ['selectError', 'createSelectorFactory', 'customMemoizer', '('], `${options.clazz}StoreSelectors.selectError,`);
    strContent = addLine(strContent, ['selectIsLoading', 'createSelectorFactory', 'customMemoizer', '('], `${options.clazz}StoreSelectors.selectIsLoading,`);

    tree.overwrite(file, strContent);
    return tree;
  };
}

/**
 * viene aggiornato un un file che contiene un json
 */
export function updateJson(objToMerge: any, file: string): Rule {
  return (tree: Tree) => {
    const content: Buffer | null = tree.read(file);
    let strContent: string = '';
    if (content) {
      strContent = content.toString();
    }
    const obj = JSON.parse(strContent);

    const objB = merge(obj, objToMerge);

    const result = JSON.stringify(objB);
    tree.overwrite(file, result);
    return tree;
  };
}

/**
 * Aggiunge una linea all'interno di un file.
 * Il punto dove viene aggiunto viene indicato passando una serie di pattern a comporre un percorso univoco all'interno del file.
 * La linea verrà aggiunta immediatamento dopo l'ultimo pattern.
 *
 * @param content attuale contenuto testuale del file a cui aggiungerela linea
 * @param patterns sequenza di chiavi che servono a identificare il punto dove aggiungere la linea, come per i css
 * @param newLine linea da aggiungere
 */
export function addLine(content: string, patterns: string[], newLine: string): string {

  let index = 0;
  patterns.forEach(value => {
    index = content.indexOf(value, index) + value.length;
  });

  return content.slice(0, index + 1) + newLine + content.slice(index);
}

/**
 * Aggiunge il modulo del nuovo store creato, come dipendenza del modulo Root
 */
export function addDeclarationToNgModule(options: ModuleOptions): Rule {
  return (host: Tree) => {
    if (!options.module) {
      return host;
    }

    const modulePath = options.module;

    const text = host.read(modulePath);
    if (text === null) {
      throw new SchematicsException(`File ${modulePath} does not exist.`);
    }
    const sourceText = text.toString();
    const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);

    // const relativePath = buildRelativeModulePath(options, modulePath);
    // @ts-ignore
    const changes = addImportToModule(source,
      modulePath,
      strings.classify(`${options.name}Module`),
      options.path as string);

    const recorder = host.beginUpdate(modulePath);
    for (const change of changes) {
      if (change instanceof InsertChange) {
        recorder.insertLeft(change.pos, change.toAdd);
      }
    }
    host.commitUpdate(recorder);

    return host;
  };
}

/**
 * Aggiunge il modulo del nuovo store creato, come dipendenza del modulo Root
 */
export function addRouteDeclarationToNgModule(options: { module: string, routeLiteral: string }): Rule {
  return (host: Tree) => {
    if (!options.module) {
      return host;
    }
    const modulePath = options.module;

    const text = host.read(modulePath);
    if (text === null) {
      throw new SchematicsException(`File ${modulePath} does not exist.`);
    }
    const sourceText = text.toString();
    const source = ts.createSourceFile(modulePath, sourceText, ts.ScriptTarget.Latest, true);

    // @ts-ignore
    const change = addRouteDeclarationToModule(source,
      modulePath,
      options.routeLiteral);

    const recorder = host.beginUpdate(modulePath);
    if (change instanceof InsertChange) {
      recorder.insertLeft(change.pos, change.toAdd);
    }
    host.commitUpdate(recorder);

    return host;
  };
}

/**
 *
 * Returns the name of the installed graphics library.:
 * - primeng
 * - ionic
 *
 */
export function getGraphicsLibraryName(tree: Tree): string {
  const content: Buffer | null = tree.read('package.json');
  let strContent: string = '';
  if (content) {
    strContent = content.toString();
  }
  if (strContent.indexOf('ionic') !== -1) {
    return 'ionic';
  }
  if (strContent.indexOf('primeng') !== -1) {
    return 'primeng';
  }
  throw new Error('libreria grafica non ');
}

/**
 *
 */
export function render(options: any, sourceTemplate: string, path: string): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const _sourceTemplate = url(sourceTemplate as string);
    const _path: string = normalize(path);
    const sourceTemplateParametrized = apply(_sourceTemplate, [
      template({
        ...options,
        ...strings
      }),
      move(_path)
    ]);
    return mergeWith(sourceTemplateParametrized);
  };
}
