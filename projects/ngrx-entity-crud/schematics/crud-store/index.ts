import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {normalize, strings} from '@angular-devkit/core';
import {addDeclarationToNgModule, addExport, addImport, addRootSelector, render, updateState} from '../my-utility';

export function crudStore(options: CrudStore): Rule {
  return (tree: Tree, _context: SchematicContext) => {
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

    const projectName = options.project as string;

    const project = workspace.projects[projectName];

    const projectType = project.projectType === 'application' ? 'app' : 'lib';

    options.path = `${project.sourceRoot}/${projectType}`;
    const path: string = 'src/app/root-store';
    const pathService: string = 'src/app/main/services';
    const pathVo: string = 'src/app/main/models/vo/';

    console.log('path', path);
    console.log('pathService', pathService);
    console.log('pathVo', pathVo);

    return chain([
      addExport(options, normalize(`${path}/index.ts`)),
      addExport(options, normalize(`${path}/index.d.ts`)),
      addImport(normalize(`${path}/state.ts`), `import {${options.clazz}StoreState} from '@root-store/${strings.dasherize(options.clazz)}-store';`),
      updateState(options, normalize(`${path}/state.ts`)),
      addImport(normalize(`${path}/selectors.ts`), `import {${options.clazz}StoreSelectors} from '@root-store/${strings.dasherize(options.clazz)}-store';`),
      addRootSelector(options, normalize(`${path}/selectors.ts`)),
      render(options, './files/crud-store', path),
      render(options, './files/service', pathService),
      render(options, './files/model', pathVo),
      addDeclarationToNgModule({
        module: `/src/app/root-store/root-store.module.ts`,
        name: `${options.clazz}Store`,
        path: `@root-store/${strings.dasherize(options.clazz)}-store`
      })
    ]);
  };
}

