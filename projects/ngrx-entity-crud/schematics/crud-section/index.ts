import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {experimental, strings,} from '@angular-devkit/core';
import {addRouteDeclarationToNgModule, getPathFromAlias, render} from "../my-utility";

// import {applyLintFix} from "../utility/lint-fix";

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
        const workspace: experimental.workspace.WorkspaceSchema = JSON.parse(workspaceContent);
        if (!options.project) {
            options.project = workspace.defaultProject;
        }

        const projectName = options.project as string;

        const project = workspace.projects[projectName];

        const projectType = project.projectType === 'application' ? 'app' : 'lib';

        options.path = `${project.sourceRoot}/${projectType}`;

        const path: string = getPathFromAlias(tree, "@views/*");
        const pathService: string = getPathFromAlias(tree, "@services/*");
        const pathVo: string = getPathFromAlias(tree, "@models/*") + "/vo/";

        console.log('path', path);
        console.log('pathService', pathService);
        console.log('pathVo', pathVo);

        let chain_ = [];
        chain_.push(render(options, './files/view', path));
        if (options.mainSection) {
            chain_.push(addRouteDeclarationToNgModule({
                    module: `/src/app/app-routing.module.ts`,
                    routeLiteral: `{path: '', redirectTo: '${strings.dasherize(options.clazz)}', pathMatch: 'full'},`
                }
            ));
        }
        chain_.push(addRouteDeclarationToNgModule({
                module: `/src/app/app-routing.module.ts`,
                routeLiteral: `{path: '${strings.dasherize(options.clazz)}', loadChildren: () => import('./main/views/${strings.dasherize(options.clazz)}/${strings.dasherize(options.clazz)}.module').then(m => m.${options.clazz}Module)}`
            }
        ));
        return chain(chain_);
    };
}




