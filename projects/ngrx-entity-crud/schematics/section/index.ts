import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {addRouteDeclarationToNgModule, render} from '../my-utility';

export function crudSection(options: CrudSection): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    options.clazz = strings.classify(options.clazz);
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
    const pathService: string = 'src/app/main/services';
    const pathVo: string = 'src/app/main/models/vo/';

    const lib = options.lib;

    console.log('path', path);
    console.log('pathService', pathService);
    console.log('pathVo', pathVo);
    console.log('lib', lib);

    const _chain = [];
    _chain.push(render(options, `./files/${lib}`, path));

    _chain.push(addRouteDeclarationToNgModule({
        module: `/src/app/app-routing.module.ts`,
        routeLiteral: `{path: '${strings.dasherize(options.clazz)}', loadChildren: () => import('./main/views/${strings.dasherize(options.clazz)}/${strings.dasherize(options.clazz)}.module').then(m => m.${options.clazz}Module)}`
      }
    ));
    return chain(_chain);
  };
}




