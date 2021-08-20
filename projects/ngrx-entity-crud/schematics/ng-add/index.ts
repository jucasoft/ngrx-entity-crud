import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {render} from '../my-utility';

// Just return the tree
export function ngAdd(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    console.log('makeStore(options: CrudStore): Rule');
    console.log('context', context);
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

    /*    const genericRules: Rule[] = [
          addExport(options, normalize(`${pathStore}/index.ts`)),
          addExport(options, normalize(`${pathStore}/index.d.ts`)),
        ];*/
    /*    const crudRules: Rule[] = [
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
        ];*/

    const baseRules: Rule[] = [
      // addImport(normalize(`${pathStore}/state.ts`), `import {${options.clazz}} from '@models/vo/${strings.dasherize(options.clazz)}';`),
      // updateState(`${strings.underscore(options.name)}:${options.clazz};`, normalize(`${pathStore}/state.ts`)),
      render(options, './files', pathStore),
      // addDeclarationToNgModule({
      //   module: `${pathStore}/root-store.module.ts`,
      //   name: `${options.clazz}Store`,
      //   path: `@root-store/${strings.dasherize(options.clazz)}-store`
      // })
    ];

    return chain(baseRules);

  };
}
