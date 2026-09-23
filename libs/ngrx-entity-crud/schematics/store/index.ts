import {chain, Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {normalize, strings} from '@angular-devkit/core';
import {addDeclarationToNgModule, addExport, addImport, render, updateState} from '../my-utility';

export function makeStore(options: CrudStore): Rule {
  return (tree: Tree, context: SchematicContext) => {
    console.log('makeStore(options: CrudStore): Rule');
    options.clazz = strings.classify(options.clazz);
    options.name = options.name ? strings.underscore(options.name) : strings.underscore(options.clazz);
    const lazy = options.registration === 'lazy';
    options.persist = !!options.persist;
    // La persistenza (createPersistence) si aggancia a Actions<T> (Restore*, entitiesSelected):
    // esiste solo per il tipo plurale, dove il cablaggio e' sempre generato e --persist decide
    // solo `enabled`. Per gli altri tipi il flag e' ignorato, ma avvisiamo: e' piu' probabile un
    // refuso che una scelta voluta.
    if (options.persist && options.type !== 'CRUD-PLURAL') {
      context.logger.warn(
        `--persist e' supportato solo per --type=CRUD-PLURAL: ignorato per --type=${options.type}.`
      );
    }
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

    let pathApp: string = 'src/app';
    let pathStore: string = 'src/app/root-store';
    let pathView: string = 'src/app/main/views';
    let pathService: string = 'src/app/main/services';
    let pathVo: string = 'src/app/main/models/vo/';

    const conf = tree.read('/ngrx-entity-crud.conf.json');
    if (conf) {
      const confData = JSON.parse(conf.toString());
      pathView = confData.pathView;
      pathStore = confData.pathStore;
      pathApp = confData.pathApp;
      pathService = confData.pathService;
      pathVo = confData.pathVo;
    }

    console.log('pathView', pathView);
    console.log('pathStore', pathStore);
    console.log('pathApp', pathApp);
    console.log('pathService', pathService);
    console.log('pathVo', pathVo);

    const genericRules: Rule[] = [
      addExport(options, normalize(`${pathStore}/index.ts`)),
      addExport(options, normalize(`${pathStore}/index.d.ts`)),
    ];

    // Il selectors.ts del progetto e' agnostico (scandisce lo stato root sfruttando la
    // convenzione EntityCrudBaseState), quindi NON va piu' accoppiato ai domini: nessun
    // import/iniezione di XxxStoreSelectors nell'aggregatore, in nessuna delle due modalita'.
    // In lazy mode, in piu', lo store non viene registrato nel RootStoreModule (va invece nel
    // feature module della view, vedi registerStoreModuleRule) e la slice e' opzionale nello
    // state root, perche' a runtime non esiste finche' il feature module non e' caricato.
    const sliceSep = lazy ? '?:' : ':';

    // Modulo della view generato da `ngrx-entity-crud:section` (stesso path convention: pathView/<clazz-dasherize>/<clazz-dasherize>.module.ts).
    // In lazy mode e' li' che deve finire l'import di <Clazz>StoreModule, non in root-store.module.ts.
    const featureModule = normalize(`${pathView}/${strings.dasherize(options.clazz)}/${strings.dasherize(options.clazz)}.module.ts`);

    const registerStoreModuleRule = (): Rule => addDeclarationToNgModule(
      lazy
        ? {module: featureModule, name: `${options.clazz}Store`, path: `@root-store/${strings.dasherize(options.clazz)}-store`}
        : {module: `${pathStore}/root-store.module.ts`, name: `${options.clazz}Store`, path: `@root-store/${strings.dasherize(options.clazz)}-store`},
      {optional: lazy}
    );

    const crudRules: Rule[] = [
      addImport(normalize(`${pathStore}/state.ts`), `import {${options.clazz}StoreState} from '@root-store/${strings.dasherize(options.clazz)}-store';`),
      updateState(`${strings.underscore(options.name)}${sliceSep}${options.clazz}StoreState.State;`, normalize(`${pathStore}/state.ts`)),
      // render(options, './files/crud-store/plural', pathStore),
      render(options, './files/crud-model', pathVo),
      registerStoreModuleRule(),
    ];

    const baseRules: Rule[] = [
      addImport(normalize(`${pathStore}/state.ts`), `import {${options.clazz}} from '@models/vo/${strings.dasherize(options.clazz)}';`),
      updateState(`${strings.underscore(options.name)}${sliceSep}${options.clazz};`, normalize(`${pathStore}/state.ts`)),
      render(options, './files/base-store', pathStore),
      render(options, './files/base-model', pathVo),
      registerStoreModuleRule(),
    ];

    if (options.type === 'CRUD+GRAPHQL') {
      const graphqlSchema = tree.read('/graphql.schema.json');
      if (!graphqlSchema) {
        throw new SchematicsException('Could not find graphql.schema.json configuration');
      }
      const graphqlSchemaString = graphqlSchema.toString();
      const graphqlSchemaJson = JSON.parse(graphqlSchemaString);
      console.log('graphqlSchemaJson', graphqlSchemaJson);
      const types: any[] = graphqlSchemaJson.__schema.types;
      const itemType = types.find(value => value.kind === 'OBJECT' && value.name === options.clazz);
      if (!itemType) {
        throw new SchematicsException('Could not find "' + options.clazz + '" in graphql.schema.json configuration, update shema');
      }
      const fields = (itemType.fields as any[]).map(value => value.name);
      console.log('fieldsB', fields);
      const optionsGQL = {...options, gqlSchema:{fields}};
      return chain([...genericRules, ...crudRules,
        render(optionsGQL, './files/crud-graphql', pathStore),
        render(options, './files/crud-service/graphql', pathService),
      ]);
    }
    if (options.type === 'CRUD-PLURAL') {
      return chain([
        ...genericRules,
        ...crudRules,
        render(options, './files/crud-store/plural', pathStore),
        // persistenza locale sempre cablata: --persist decide solo `enabled` in <clazz>.persistence.ts
        render(options, './files/crud-persistence', pathStore),
        render(options, './files/crud-service/plural', pathService)
      ]);
    }
    if (options.type === 'CRUD-SINGULAR') {
      return chain([
        ...genericRules,
        ...crudRules,
        render(options, './files/crud-store/singular', pathStore),
        render(options, './files/crud-service/singular', pathService)
      ]);
    }
    if (options.type === 'BASE') {
      return chain([
        ...genericRules,
        ...baseRules
      ]);
    }

  };
}

