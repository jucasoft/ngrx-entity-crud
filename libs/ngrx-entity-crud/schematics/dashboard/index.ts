import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {addRouteDeclarationToNgModule, render} from '../my-utility';
import {lazyReport} from '../lazy-report/index';
import {tableReport} from '../table-report/index';

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

/** Opzioni con cui comporre `lazyReport`; `null` se disattivato (`--include-lazy-report=false`). */
export function lazyReportComposition(options: Dashboard): {output: string; format: 'json'} | null {
  if (options.includeLazyReport === false) {
    return null;
  }
  return {output: options.lazyReportOutput || 'src/assets/lazy-report.json', format: 'json'};
}

/** Opzioni con cui comporre `tableReport`; `null` se disattivato (`--include-table-report=false`). */
export function tableReportComposition(options: Dashboard): {output: string; format: 'json'} | null {
  if (options.includeTableReport === false) {
    return null;
  }
  return {output: options.tableReportOutput || 'src/assets/table-report.json', format: 'json'};
}

/**
 * URL runtime dell'asset generato (path filesystem senza il prefisso `src/`), passato al
 * template del wrapper così `<nec-dashboard>` legge il report DOVE lo schematic lo scrive.
 * Stringa vuota se il report è disattivato: per il componente '' disattiva/nasconde il pannello.
 */
export function reportAssetUrl(composition: {output: string} | null): string {
  return composition ? composition.output.replace(/^src\//, '') : '';
}

/**
 * `true` (default) se il wrapper deve includere il pannello `<nec-scaffold>`. Passato SEMPRE
 * esplicito al render: le opzioni possono arrivare senza i default dello schema (es. test).
 */
export function scaffoldEnabled(options: Dashboard): boolean {
  return options.includeScaffold !== false;
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

    const lazy = lazyReportComposition(options);
    const table = tableReportComposition(options);

    const _chain: Rule[] = [
      // Genera SOLO un thin wrapper PrimeNG che ospita <nec-dashboard>: la logica vive nella
      // libreria (ngrx-entity-crud/devtools). MergeStrategy.Overwrite (14) confinato al chrome.
      // Gli URL runtime nel template seguono i path di output dei report (niente hard-coding).
      render(
        {
          ...options,
          lazyReportUrl: reportAssetUrl(lazy),
          tableReportUrl: reportAssetUrl(table),
          includeScaffold: scaffoldEnabled(options),
        },
        './files/primeng',
        pathView
      ),
    ];

    // Idempotenza sul re-run (--force): addRouteDeclarationToNgModule non deduplica, quindi
    // la rotta si aggiunge solo se il routing non referenzia già il modulo generato.
    const routingPath = `/${pathApp}/app-routing.module.ts`;
    const routingBuf = tree.read(routingPath);
    const dash = strings.dasherize(options.clazz);
    const alreadyRouted =
      routingBuf !== null && routingBuf.toString().indexOf(`views/${dash}/${dash}.module`) !== -1;
    if (!alreadyRouted) {
      _chain.push(
        addRouteDeclarationToNgModule({
          module: `${pathApp}/app-routing.module.ts`,
          routeLiteral: dashboardRouteLiteral(options.clazz),
        })
      );
    }

    // Riuso (non duplicazione): genera anche gli inventari statici letti a runtime dalla dashboard.
    if (lazy) {
      _chain.push(lazyReport(lazy));
    }
    if (table) {
      _chain.push(tableReport(table));
    }

    return chain(_chain);
  };
}
