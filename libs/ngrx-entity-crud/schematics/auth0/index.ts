import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {addDeclarationToNgModule, addExport, addImport, render, updateState} from '../my-utility';
import {normalize, strings} from '@angular-devkit/core';

export function makeAuth0(options: Auth): Rule {
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

    //  const view = getView(options, pathView);
    const store = getStore(options, pathStore, pathVo);

    return chain([...store]);
  };
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
      module: `${path}/root-store.module.ts`,
      name: `${options.clazz}Store`,
      path: `@root-store/${strings.dasherize(options.clazz)}-store`
    })
  ];
  return result;
}
