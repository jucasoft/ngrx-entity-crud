"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const my_utility_1 = require("../my-utility");
// import {applyLintFix} from "../utility/lint-fix";
function crudSection(options) {
    return (tree, _context) => {
        options.clazz = core_1.strings.classify(options.clazz);
        const workspaceConfig = tree.read('/angular.json');
        if (!workspaceConfig) {
            throw new schematics_1.SchematicsException('Could not find Angular workspace configuration');
        }
        // convert workspace to string
        const workspaceContent = workspaceConfig.toString();
        // parse workspace string into JSON object
        const workspace = JSON.parse(workspaceContent);
        if (!options.project) {
            options.project = workspace.defaultProject;
        }
        const projectName = options.project;
        const project = workspace.projects[projectName];
        const projectType = project.projectType === 'application' ? 'app' : 'lib';
        options.path = `${project.sourceRoot}/${projectType}`;
        const path = my_utility_1.getPathFromAlias(tree, "@views/*");
        const pathService = my_utility_1.getPathFromAlias(tree, "@services/*");
        const pathVo = my_utility_1.getPathFromAlias(tree, "@models/*") + "/vo/";
        console.log('path', path);
        console.log('pathService', pathService);
        console.log('pathVo', pathVo);
        let chain_ = [];
        chain_.push(my_utility_1.render(options, './files/view', path));
        if (options.mainSection) {
            chain_.push(my_utility_1.addRouteDeclarationToNgModule({
                module: `/src/app/app-routing.module.ts`,
                routeLiteral: `{path: '', redirectTo: '${core_1.strings.dasherize(options.clazz)}', pathMatch: 'full'},`
            }));
        }
        chain_.push(my_utility_1.addRouteDeclarationToNgModule({
            module: `/src/app/app-routing.module.ts`,
            routeLiteral: `{path: '${core_1.strings.dasherize(options.clazz)}', loadChildren: () => import('./main/views/${core_1.strings.dasherize(options.clazz)}/${core_1.strings.dasherize(options.clazz)}.module').then(m => m.${options.clazz}Module)}`
        }));
        return schematics_1.chain(chain_);
    };
}
exports.crudSection = crudSection;
//# sourceMappingURL=index.js.map