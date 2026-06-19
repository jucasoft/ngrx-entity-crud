import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {addRouteDeclarationToNgModule, render} from '../my-utility';
import {lazyReport} from '../lazy-report/index';

/**
 * Risolve il nome del progetto Angular.
 *
 * Corregge il bug ereditato da `section`: `workspace.defaultProject` è stato rimosso dal
 * formato workspace di Angular 15+. Fallback robusto: opzione esplicita -> defaultProject
 * (legacy, se ancora presente) -> primo progetto. Lancia se nessun progetto è risolvibile.
 */
export function resolveProjectName(workspace: any, project?: string): string {
  const projects = (workspace && workspace.projects) || {};
  const name = project || (workspace && workspace.defaultProject) || Object.keys(projects)[0];
  if (!name || !projects[name]) {
    throw new SchematicsException(
      'Impossibile determinare il progetto Angular: specifica --project=<name>. ' +
        `Progetti disponibili: ${Object.keys(projects).join(', ') || '(nessuno)'}.`
    );
  }
  return name;
}

/** Literal della rotta lazy verso il modulo dashboard generato. */
export function dashboardRouteLiteral(clazz: string): string {
  const dash = strings.dasherize(clazz);
  return `{path: '${dash}', loadChildren: () => import('./main/views/${dash}/${dash}.module').then(m => m.${clazz}Module)}`;
}

export function makeDashboard(options: Dashboard): Rule {
  return (tree: Tree, _context: SchematicContext) => {
    options.clazz = strings.classify(options.clazz || 'Dashboard');

    const workspaceConfig = tree.read('/angular.json');
    if (!workspaceConfig) {
      throw new SchematicsException('Could not find Angular workspace configuration (/angular.json)');
    }
    const workspace = JSON.parse(workspaceConfig.toString());
    options.project = resolveProjectName(workspace, options.project);

    let pathApp = 'src/app';
    let pathView = 'src/app/main/views';
    const conf = tree.read('/ngrx-entity-crud.conf.json');
    if (conf) {
      const confData = JSON.parse(conf.toString());
      if (typeof confData.pathApp === 'string') {
        pathApp = confData.pathApp;
      }
      if (typeof confData.pathView === 'string') {
        pathView = confData.pathView;
      }
    }

    const _chain: Rule[] = [
      // Genera SOLO un thin wrapper PrimeNG che ospita <nec-dashboard>: la logica vive nella
      // libreria (ngrx-entity-crud/devtools). MergeStrategy.Overwrite (14) confinato al chrome.
      render(options, './files/primeng', pathView),
      addRouteDeclarationToNgModule({
        module: `${pathApp}/app-routing.module.ts`,
        routeLiteral: dashboardRouteLiteral(options.clazz),
      }),
    ];

    // Riuso (non duplicazione): genera anche l'inventario statico letto a runtime dalla dashboard.
    if (options.includeLazyReport !== false) {
      _chain.push(
        lazyReport({
          output: options.lazyReportOutput || 'src/assets/lazy-report.json',
          format: 'json',
        })
      );
    }

    return chain(_chain);
  };
}
