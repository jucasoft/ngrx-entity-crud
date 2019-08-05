"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const my_utility_1 = require("../my-utility");
function crudStore(options) {
    return (tree, _context) => {
        options.clazz = core_1.strings.classify(options.clazz);
        options.name = options.name ? core_1.strings.underscore(options.name) : core_1.strings.underscore(options.clazz);
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
        const path = core_1.normalize(options.path + "/root-store/");
        const pathService = my_utility_1.getPathFromAlias(tree, "@services/*");
        const pathVo = my_utility_1.getPathFromAlias(tree, "@models/*") + "/vo/";
        console.log('path', path);
        console.log('pathService', pathService);
        console.log('pathVo', pathVo);
        return schematics_1.chain([
            my_utility_1.addExport(options, core_1.normalize(`${path}/index.ts`)),
            my_utility_1.addExport(options, core_1.normalize(`${path}/index.d.ts`)),
            my_utility_1.addImport(core_1.normalize(`${path}/state.ts`), `import {${options.clazz}StoreState} from '@root-store/${core_1.strings.dasherize(options.clazz)}-store';`),
            my_utility_1.updateState(options, core_1.normalize(`${path}/state.ts`)),
            my_utility_1.addImport(core_1.normalize(`${path}/selectors.ts`), `import {${options.clazz}StoreSelectors} from '@root-store/${core_1.strings.dasherize(options.clazz)}-store';`),
            my_utility_1.addRootSelector(options, core_1.normalize(`${path}/selectors.ts`)),
            my_utility_1.render(options, './files/crud-store', path),
            my_utility_1.render(options, './files/service', pathService),
            my_utility_1.render(options, './files/model', pathVo),
            my_utility_1.addDeclarationToNgModule({
                module: `/src/app/root-store/root-store.module.ts`,
                name: `${options.clazz}Store`,
                path: `@root-store/${core_1.strings.dasherize(options.clazz)}-store`
            })
        ]);
    };
}
exports.crudStore = crudStore;
//# sourceMappingURL=index.js.map