import { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';

// Just return the tree
export function ngAdd(options: any): Rule {
  return (tree: Tree, context: SchematicContext) => {
    console.log(options)
    context.addTask(new NodePackageInstallTask());
    return tree;
  };
}
