/**
 * Crud store schematics
 */
declare interface CrudSection {
    /**
     * The path at which to create the component file, relative to the current workspace. Default is a folder with the same name as the component in the project root.
     */
    path?: string; // path
    /**
     * The name of the entity.
     */
    clazz: string;
    /**
     * if it is the default section, a route rule such as "{path: '', redirectTo: '{{sectionNAme}}', pathMatch: 'full'}" will be added to the main module
     */
    mainSection: boolean;
    /**
     * The name of the project.
     */
    project?: string;
}
