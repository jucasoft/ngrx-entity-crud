import {chain, Rule, SchematicsException, Tree} from '@angular-devkit/schematics';
import {addDeclarationToNgModule, render, updateTsConfigSelector} from '../my-utility';

// Just return the tree
export function ngAdd(options: any): Rule {
  return (tree: Tree) => {
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

    // updateTsConfigSelector()
    const baseRules: Rule[] = [
      // addImport(normalize(`${pathStore}/state.ts`), `import {${options.clazz}} from '@models/vo/${strings.dasherize(options.clazz)}';`),
      // updateState(`${strings.underscore(options.name)}:${options.clazz};`, normalize(`${pathStore}/state.ts`)),
      render(options, './files', ''),
    addDeclarationToNgModule({
        module: `${pathApp}/app.module.ts`,
        name: `ThemeJng`,
        path: `./core/theme/theme-jng.module`
      }),
      addDeclarationToNgModule({
        module: `${pathApp}/app.module.ts`,
        name: `BrowserAnimations`,
        path: `@angular/platform-browser/animations`
      }),
      addDeclarationToNgModule({
        module: `${pathApp}/app.module.ts`,
        name: `RootStore`,
        path: `./root-store`
      }),
      updateTsConfigSelector()
    ];

    return chain(baseRules);

  };
}

