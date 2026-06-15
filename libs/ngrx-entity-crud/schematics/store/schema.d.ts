/**
 * Crud store schematics
 */
declare interface CrudStore {
  /**
   * The path at which to create the component file, relative to the current workspace. Default is a folder with the same name as the component in the project root.
   */
  path?: string; // path
  /**
   * The name of the entity.
   */
  clazz: string;
  /**
   * The feature name.
   */
  name: string;
  /**
   * The name of the project.
   */
  project?: string;

  /**
   * The name of the project.
   */
  type: 'CRUD-PLURAL' | 'CRUD-SINGULAR' | 'CRUD+GRAPHQL' | 'BASE';

  /**
   * Come registrare lo store: eager nel RootStoreModule (comportamento storico)
   * oppure lazy nel feature module della view.
   * Opzionale: se omesso, in modalità interattiva viene chiesto via x-prompt;
   * in modalità non interattiva resta undefined e viene trattato come 'eager'.
   */
  registration?: 'eager' | 'lazy';
}
