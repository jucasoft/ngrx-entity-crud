"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const core_1 = require("@angular-devkit/core");
const my_utility_1 = require("../my-utility");
const dependencies_1 = require("../utility/dependencies");
// import {addPackageJsonDependency, NodeDependencyType} from "./utility/dependencies";
function initAppStore(options) {
    return (tree, _context) => {
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
        const sourceTemplate = schematics_1.url('./files/root-store');
        const path = core_1.normalize(options.path);
        addPackageJsonDependencys(tree);
        const sourceTemplateParametrized = schematics_1.apply(sourceTemplate, [
            schematics_1.template(Object.assign({}, options, core_1.strings)),
            schematics_1.move(path)
        ]);
        const rules = [
            schematics_1.mergeWith(sourceTemplateParametrized),
            my_utility_1.addDeclarationToNgModule({
                module: `/src/app/app.module.ts`,
                name: `RootStore`,
                path: `./root-store`
            }),
            my_utility_1.addDeclarationToNgModule({
                module: `/src/app/app.module.ts`,
                name: `HttpClient`,
                path: `@angular/common/http`
            }),
            my_utility_1.updateJson({
                "compilerOptions": {
                    "paths": {
                        "@components/*": [
                            "src/app/main/components/*"
                        ],
                        "@services/*": [
                            "src/app/main/services/*"
                        ],
                        "@models/*": [
                            "src/app/main/models/*"
                        ],
                        "@views/*": [
                            "src/app/main/views/*"
                        ],
                        "@core/*": [
                            "src/app/core/*"
                        ],
                        "@root-store/*": [
                            "src/app/root-store/*"
                        ]
                    }
                },
            }, "tsconfig.json")
        ];
        const sourceInitAppTemplateParametrized = schematics_1.apply(schematics_1.url('./files/init-app'), [
            schematics_1.template(Object.assign({}, options, core_1.strings)),
            schematics_1.move(core_1.normalize(options.path))
        ]);
        // rules.push(applyLintFix(options.path));
        rules.push(schematics_1.mergeWith(sourceInitAppTemplateParametrized));
        return schematics_1.chain(rules);
    };
}
exports.initAppStore = initAppStore;
function addPackageJsonDependencys(tree) {
    // addPackageJsonDependency(tree, {
    //     name: "@angular/cdk",
    //     version: "^7.2.0",
    //     type: NodeDependencyType.Default
    // });
    // addPackageJsonDependency(tree, {
    //     name: "@fortawesome/fontawesome-free",
    //     version: "^5.5.0",
    //     type: NodeDependencyType.Default
    // });
    // addPackageJsonDependency(tree, {
    //     name: "@ng-select/ng-select",
    //     version: "^2.20.0",
    //     type: NodeDependencyType.Default
    // });
    dependencies_1.addPackageJsonDependency(tree, {
        name: "@ngrx/effects",
        version: "^8.0.0",
        type: dependencies_1.NodeDependencyType.Default
    });
    dependencies_1.addPackageJsonDependency(tree, {
        name: "@ngrx/entity",
        version: "^8.0.0",
        type: dependencies_1.NodeDependencyType.Default
    });
    dependencies_1.addPackageJsonDependency(tree, {
        name: "@ngrx/router-store",
        version: "^8.0.0",
        type: dependencies_1.NodeDependencyType.Default
    });
    dependencies_1.addPackageJsonDependency(tree, {
        name: "@ngrx/store",
        version: "^8.0.0",
        type: dependencies_1.NodeDependencyType.Default
    });
    dependencies_1.addPackageJsonDependency(tree, {
        name: "@ngrx/store-devtools",
        version: "^8.0.0",
        type: dependencies_1.NodeDependencyType.Default
    });
    // addPackageJsonDependency(tree, {
    //     name: "@ngx-progressbar/core",
    //     version: "^5.2.1",
    //     type: NodeDependencyType.Default
    // });
    // addPackageJsonDependency(tree, {
    //     name: "@ngx-progressbar/http",
    //     version: "^5.2.1",
    //     type: NodeDependencyType.Default
    // });
    // addPackageJsonDependency(tree, {name: "core-js", version: "^2.5.4", type: NodeDependencyType.Default});
    // addPackageJsonDependency(tree, {name: "deep-equal", version: "^1.0.1", type: NodeDependencyType.Default});
    // addPackageJsonDependency(tree, {name: "lodash.memoize", version: "^4.1.2", type: NodeDependencyType.Default});
    dependencies_1.addPackageJsonDependency(tree, { name: "ngrx-entity-crud", version: "0.3.1", type: dependencies_1.NodeDependencyType.Default });
    // addPackageJsonDependency(tree, {name: "ngx-spinner", version: "^7.1.4", type: NodeDependencyType.Default});
    // addPackageJsonDependency(tree, {name: "primeflex", version: "^1.0.0-rc.1", type: NodeDependencyType.Default});
    dependencies_1.addPackageJsonDependency(tree, { name: "primeicons", version: "^1.0.0", type: dependencies_1.NodeDependencyType.Default });
    dependencies_1.addPackageJsonDependency(tree, { name: "primeng", version: "^8.0.0", type: dependencies_1.NodeDependencyType.Default });
}
exports.addPackageJsonDependencys = addPackageJsonDependencys;
//# sourceMappingURL=index.js.map