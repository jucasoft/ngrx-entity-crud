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

    const pathView: string = 'src/app/main/views';
    const pathStore: string = 'src/app/root-store';
    const pathVo: string = 'src/app/main/models/vo/';

    console.log('pathView', pathView);
    console.log('pathStore', pathStore);
    console.log('pathVo', pathVo);

    const view = getView(options, pathView);
    const store = getStore(options, pathStore, pathVo);

    return chain([...view, ...store]);
  };
}


function getView(options: Auth, path: string): Rule[] {
  const result: Rule[] = [
    render(options, `./files/views`, path),
    addRouteDeclarationToNgModule({
        module: `/src/app/app-routing.module.ts`,
        routeLiteral: `{path: 'login', loadChildren: () => import('./main/views/login/login.module').then(m => m.LoginModule)}`
      }
    )];
  return result;
}

function getStore(options: Auth, path: string, pathVo: string): Rule[] {
  const result: Rule[] = [
    addExport(options, normalize(`${path}/index.ts`)),
    addExport(options, normalize(`${path}/index.d.ts`)),
    addImport(normalize(`${path}/state.ts`), `import {${options.clazz}} from '@models/vo/${strings.dasherize(options.clazz)}';`),
    updateState(`${strings.underscore(options.name)}:${options.clazz};`, normalize(`${path}/state.ts`)),
    render(options, './files/store', path),
    render(options, './files/model', pathVo),
    addDeclarationToNgModule({
      module: `/src/app/root-store/root-store.module.ts`,
      name: `${options.clazz}Store`,
      path: `@root-store/${strings.dasherize(options.clazz)}-store`
    })
  ];
  return result;
}
