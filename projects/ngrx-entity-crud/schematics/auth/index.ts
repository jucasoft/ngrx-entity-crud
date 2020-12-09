import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {addRouteDeclarationToNgModule, render} from '../my-utility';

export function make(options: CrudSection): Rule {
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

    const path: string = 'src/app/main/views';
    const pathVo: string = 'src/app/main/models/vo/';

    console.log('path', path);
    console.log('pathVo', pathVo);

    const _chain = [];
    _chain.push(render(options, `./files/views`, path));

    _chain.push(addRouteDeclarationToNgModule({
        module: `/src/app/app-routing.module.ts`,
        routeLiteral: `{path: 'login', loadChildren: () => import('./main/views/login.module').then(m => m.LoginModule)}`
      }
    ));
    return chain(_chain);
  };
}




