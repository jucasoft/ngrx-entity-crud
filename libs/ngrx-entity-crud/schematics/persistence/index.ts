import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {normalize, strings} from '@angular-devkit/core';
import {render} from '../my-utility';
import {
  patchMainComponentHtml,
  patchMainComponentTs,
  PatchResult,
  patchSectionModule,
  patchStoreIndex,
  patchStoreModule,
} from './patches';

/**
 * `ng g ngrx-entity-crud:persistence --clazz=Coin [--enabled] [--ui=false]`
 *
 * Aggiunge la persistenza locale a una sezione CRUD-PLURAL gia' generata (le sezioni nuove la
 * hanno gia' dallo schematic `store`):
 * - crea `<clazz>.persistence.ts` nello store (stesso template dello schematic `store`);
 * - registra reducer ed effects in `<clazz>-store.module.ts` ed esporta il bundle da `index.ts`;
 * - con `--ui` (default) collega `<nec-restore-search>` al componente main della sezione.
 *
 * Le sezioni possono essere state modificate a mano: dove il punto d'aggancio non si trova lo
 * schematic non indovina, lascia un marcatore che non compila (`NEC_PASSO_MANUALE__...` nei file
 * .ts, `<nec-passo-manuale-...>` nei template). `ng build` indica cosi' ogni passo da completare.
 */
export function addPersistence(options: CrudPersistence): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const clazz = strings.classify(options.clazz);
    const dash = strings.dasherize(clazz);

    let pathStore = 'src/app/root-store';
    let pathView = 'src/app/main/views';
    const conf = tree.read('/ngrx-entity-crud.conf.json');
    if (conf) {
      const confData = JSON.parse(conf.toString());
      pathStore = confData.pathStore ?? pathStore;
      pathView = confData.pathView ?? pathView;
    }

    const storeDir = normalize(`${pathStore}/${dash}-store`);
    const state = tree.read(`${storeDir}/${dash}.state.ts`);
    if (!state) {
      throw new SchematicsException(
        `Store non trovato: ${storeDir}/${dash}.state.ts. Genera prima lo store (ng g ngrx-entity-crud:store --clazz=${clazz}).`
      );
    }
    if (!/\bEntityCrudState</.test(state.toString())) {
      throw new SchematicsException(
        `${storeDir} non e' uno store CRUD-PLURAL: la persistenza locale richiede Restore* ed entitiesSelected, presenti solo nel plurale.`
      );
    }

    const manual: string[] = [];
    const patchFile = (path: string, patch: (content: string) => PatchResult, missing: 'error' | 'skip'): Rule =>
      (host: Tree) => {
        const buffer = host.read(path);
        if (!buffer) {
          if (missing === 'error') {
            manual.push(`${path}: file non trovato, collega a mano ${clazz}Persistence`);
          } else {
            context.logger.info(`- ${path}: non trovato, saltato`);
          }
          return host;
        }
        const result = patch(buffer.toString());
        if (result.content !== buffer.toString()) {
          host.overwrite(path, result.content);
        }
        result.applied.forEach((step) => context.logger.info(`✔ ${path}: ${step}`));
        result.manual.forEach((step) => manual.push(`${path}: ${step}`));
        return host;
      };

    const rules: Rule[] = [];

    const persistenceFile = `${storeDir}/${dash}.persistence.ts`;
    if (tree.exists(persistenceFile)) {
      context.logger.info(`- ${persistenceFile}: esiste gia', lasciato invariato`);
    } else {
      rules.push(render({clazz, persist: !!options.enabled}, '../store/files/crud-persistence', pathStore));
      context.logger.info(`✔ ${persistenceFile}: creato (enabled: ${!!options.enabled})`);
    }

    rules.push(patchFile(`${storeDir}/${dash}-store.module.ts`, (c) => patchStoreModule(c, clazz), 'error'));
    rules.push(patchFile(`${storeDir}/index.ts`, (c) => patchStoreIndex(c, clazz), 'error'));
    rules.push(patchFile(`${storeDir}/index.d.ts`, (c) => patchStoreIndex(c, clazz), 'skip'));

    if (options.ui !== false) {
      const sectionDir = normalize(`${pathView}/${dash}`);
      if (tree.exists(`${sectionDir}/${dash}.module.ts`)) {
        rules.push(patchFile(`${sectionDir}/${dash}.module.ts`, (c) => patchSectionModule(c, clazz), 'error'));
        rules.push(patchFile(`${sectionDir}/${dash}-main/${dash}-main.component.ts`, (c) => patchMainComponentTs(c, clazz), 'error'));
        rules.push(patchFile(`${sectionDir}/${dash}-main/${dash}-main.component.html`, patchMainComponentHtml, 'error'));
      } else {
        context.logger.info(`- ${sectionDir}: sezione UI non trovata, collego solo lo store`);
      }
    }

    rules.push((host: Tree) => {
      if (manual.length) {
        context.logger.warn(
          `Passi da completare a mano (${manual.length}). La compilazione fallisce apposta sui marcatori ` +
          'NEC_PASSO_MANUALE__* (file .ts) e <nec-passo-manuale-*> (template) finche\' non li completi e li cancelli:\n' +
          manual.map((step) => `  - ${step}`).join('\n')
        );
      } else {
        context.logger.info(
          `Persistenza di ${clazz} collegata. ${options.enabled ? 'Attiva' : 'Spenta: per attivarla imposta enabled: true in ' + persistenceFile}.`
        );
      }
      return host;
    });

    return chain(rules);
  };
}
