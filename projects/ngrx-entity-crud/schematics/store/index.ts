import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {normalize, strings} from '@angular-devkit/core';
import {addDeclarationToNgModule, addExport, addImport, addRootSelector, render, updateState} from '../my-utility';

export function makeStore(options: CrudStore): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    console.log('makeStore(options: CrudStore): Rule');
    options.clazz = strings.classify(options.clazz);
    options.name = options.name ? strings.underscore(options.name) : strings.underscore(options.clazz);
    const workspaceConfig = tree.read('/angular.json');
    if (!workspaceConfig) {
      throw new SchematicsException('Could not find Angular workspace configuration');
    }

    // convert workspace to string
    const workspaceContent = workspaceConfig.toString();

    // parse workspace string into JSON object
    const workspace = JSON.parse(workspaceContent);
    if (!options.project) {
      options.project = workspace.defaultProject;
    }

    let pathApp: string = 'src/app';
    let pathStore: string = 'src/app/root-store';
    let pathView: string = 'src/app/main/views';
    let pathService: string = 'src/app/main/services';
    let pathVo: string = 'src/app/main/models/vo/';

    const conf = tree.read('/ngrx-entity-crud.conf.json');
    if (conf) {
      const confData = JSON.parse(conf.toString());
      pathView = confData.pathView;
      pathStore = confData.pathStore;
      pathApp = confData.pathApp;
      pathService = confData.pathService;
      pathVo = confData.pathVo;
    }

    console.log('pathView', pathView);
    console.log('pathStore', pathStore);
    console.log('pathApp', pathApp);
    console.log('pathService', pathService);
    console.log('pathVo', pathVo);

    const genericRules: Rule[] = [
      addExport(options, normalize(`${pathStore}/index.ts`)),
      addExport(options, normalize(`${pathStore}/index.d.ts`)),
    ];
    const crudRules: Rule[] = [
      addImport(normalize(`${pathStore}/state.ts`), `import {${options.clazz}StoreState} from '@root-store/${strings.dasherize(options.clazz)}-store';`),
      updateState(`${strings.underscore(options.name)}:${options.clazz}StoreState.State;`, normalize(`${pathStore}/state.ts`)),
      addImport(normalize(`${pathStore}/selectors.ts`), `import {${options.clazz}StoreSelectors} from '@root-store/${strings.dasherize(options.clazz)}-store';`),
      addRootSelector(options, normalize(`${pathStore}/selectors.ts`)),
      render(options, './files/crud-store', pathStore),
      render(options, './files/crud-service', pathService),
      render(options, './files/crud-model', pathVo),
      addDeclarationToNgModule({
        module: `${pathStore}/root-store.module.ts`,
        name: `${options.clazz}Store`,
        path: `@root-store/${strings.dasherize(options.clazz)}-store`
      })
    ];

    const baseRules: Rule[] = [
      addImport(normalize(`${pathStore}/state.ts`), `import {${options.clazz}} from '@models/vo/${strings.dasherize(options.clazz)}';`),
      updateState(`${strings.underscore(options.name)}:${options.clazz};`, normalize(`${pathStore}/state.ts`)),
      render(options, './files/base-store', pathStore),
      render(options, './files/base-model', pathVo),
      addDeclarationToNgModule({
        module: `${pathStore}/root-store.module.ts`,
        name: `${options.clazz}Store`,
        path: `@root-store/${strings.dasherize(options.clazz)}-store`
      })
    ];

    if (options.type === 'CRUD+GRAPHQL') {
      const graphqlSchema = tree.read('/graphql.schema.json');
      if (!graphqlSchema) {
        throw new SchematicsException('Could not find Angular workspace configuration');
      }
      const graphqlSchemaString = workspaceConfig.toString();
      const graphqlSchemaJson = JSON.parse(graphqlSchemaString);
      const types: any[] = graphqlSchemaJson.__schema.types;
      const itemType = types.find(value => value.kind === 'OBJECT' && value.name === options.clazz);
      const fields = (itemType.fields as any[]).map(value => value.name);
      console.log('fields', fields);
      const optionsGQL = {...options, gqlSchema:{fields}}
      return chain([...genericRules, ...crudRules, render(optionsGQL, './files/crud-graphql', pathStore)]);
    }
    if (options.type === 'CRUD') {
      return chain([...genericRules, ...crudRules]);
    }
    if (options.type === 'BASE') {
      return chain([...genericRules, ...baseRules]);
    }

  };
}

