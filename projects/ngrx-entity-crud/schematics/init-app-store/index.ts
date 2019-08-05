import {apply, chain, mergeWith, move, Rule, SchematicContext, SchematicsException, template, Tree, url} from '@angular-devkit/schematics';

import {experimental, normalize, strings,} from '@angular-devkit/core';
import {addDeclarationToNgModule, updateJson} from "../my-utility";
import {addPackageJsonDependency, NodeDependencyType} from "../utility/dependencies";

// import {addPackageJsonDependency, NodeDependencyType} from "./utility/dependencies";

export function initAppStore(options: InitAppStore): Rule {
    return (tree: Tree, _context: SchematicContext) => {

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

        const sourceTemplate = url('./files/root-store');
        const path: string = normalize(options.path as string);

        addPackageJsonDependencys(tree);

        const sourceTemplateParametrized = apply(sourceTemplate, [
            template({
                ...options,
                ...strings
            }),
            move(path)
        ]);

        const rules = [
            mergeWith(sourceTemplateParametrized),
            addDeclarationToNgModule({
                module: `/src/app/app.module.ts`,
                name: `RootStore`,
                path: `./root-store`
            }),
            addDeclarationToNgModule({
                module: `/src/app/app.module.ts`,
                name: `HttpClient`,
                path: `@angular/common/http`
            }),
            updateJson({
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

        const sourceInitAppTemplateParametrized = apply(url('./files/init-app'), [
            template({
                ...options,
                ...strings
            }),
            move(normalize(options.path as string))
        ]);
        // rules.push(applyLintFix(options.path));
        rules.push(mergeWith(sourceInitAppTemplateParametrized));


        return chain(rules);
    };
}


export function addPackageJsonDependencys(tree: Tree) {
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
    addPackageJsonDependency(tree, {
        name: "@ngrx/effects",
        version: "^8.0.0",
        type: NodeDependencyType.Default
    });
    addPackageJsonDependency(tree, {
        name: "@ngrx/entity",
        version: "^8.0.0",
        type: NodeDependencyType.Default
    });
    addPackageJsonDependency(tree, {
        name: "@ngrx/router-store",
        version: "^8.0.0",
        type: NodeDependencyType.Default
    });
    addPackageJsonDependency(tree, {
        name: "@ngrx/store",
        version: "^8.0.0",
        type: NodeDependencyType.Default
    });
    addPackageJsonDependency(tree, {
        name: "@ngrx/store-devtools",
        version: "^8.0.0",
        type: NodeDependencyType.Default
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
    addPackageJsonDependency(tree, {name: "ngrx-entity-crud", version: "0.3.1", type: NodeDependencyType.Default});
    // addPackageJsonDependency(tree, {name: "ngx-spinner", version: "^7.1.4", type: NodeDependencyType.Default});
    // addPackageJsonDependency(tree, {name: "primeflex", version: "^1.0.0-rc.1", type: NodeDependencyType.Default});
    addPackageJsonDependency(tree, {name: "primeicons", version: "^1.0.0", type: NodeDependencyType.Default});
    addPackageJsonDependency(tree, {name: "primeng", version: "^8.0.0", type: NodeDependencyType.Default});
}
