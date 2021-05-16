import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {addDeclarationToNgModule, addExport, addImport, addRouteDeclarationToNgModule, render, updateState} from '../my-utility';
import {normalize, strings} from '@angular-devkit/core';

export function makeAuth(options: Auth): Rule {
  return (tree: Tree, _context: SchematicContext) => {
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

    const projectName = options.project as string;

    const project = workspace.projects[projectName];

    const projectType = project.projectType === 'application' ? 'app' : 'lib';

    options.path = `${project.sourceRoot}/${projectType}`;
    options.clazz = 'Auth';
    options.name = 'auth';

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

    const view = getView(options, pathView, pathApp);
    const store = getStore(options, pathStore, pathVo);

    return chain([...view, ...store]);
  };
}


function getView(options: Auth, pathView: string, pathApp: string): Rule[] {
  const result: Rule[] = [
    render(options, `./files/views`, pathView),
    addRouteDeclarationToNgModule({
        module: `${pathApp}/app-routing.module.ts`,
        routeLiteral: `{path: 'login', loadChildren: () => import('./main/views/login/login.module').then(m => m.LoginModule)}`
      }
    )];
  return result;
}

function getStore(options: Auth, pathStore: string, pathVo: string): Rule[] {
  const result: Rule[] = [
    addExport(options, normalize(`${pathStore}/index.ts`)),
    addExport(options, normalize(`${pathStore}/index.d.ts`)),
    addImport(normalize(`${pathStore}/state.ts`), `import {${options.clazz}} from '@models/vo/${strings.dasherize(options.clazz)}';`),
    updateState(`${strings.underscore(options.name)}:${options.clazz};`, normalize(`${pathStore}/state.ts`)),
    render(options, './files/store', pathStore),
    render(options, './files/model', pathVo),
    addDeclarationToNgModule({
      module: `${pathStore}/root-store.module.ts`,
      name: `${options.clazz}Store`,
      path: `@root-store/${strings.dasherize(options.clazz)}-store`
    })
  ];
  return result;
}
