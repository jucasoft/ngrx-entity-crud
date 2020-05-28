#errori da correggere in futuro:

## schematics/my-utility.ts:150:39
schematics/my-utility.ts:150:39 - error TS2345: Argument of type 'ts.SourceFile' is not assignable to parameter of type 'import("/Users/lluuccaa1gmail.com/VCS/ngrx-entity-crud/projects/ngrx-entity-crud/schematics/third_party/github.com/Microsoft/TypeScript/lib/typescript").SourceFile'.
  Types of property 'kind' are incompatible.
    Type 'ts.SyntaxKind.SourceFile' is not assignable to type 'import("/Users/lluuccaa1gmail.com/VCS/ngrx-entity-crud/projects/ngrx-entity-crud/schematics/third_party/github.com/Microsoft/TypeScript/lib/typescript").SyntaxKind.SourceFile'.

150     const changes = addImportToModule(source,
                                          ~~~~~~
                                          
### per ora ho ignorato l'errore:
    projects/ngrx-entity-crud/schematics/my-utility.ts:151
    // const relativePath = buildRelativeModulePath(options, modulePath);
    // @ts-ignore
    const changes = addImportToModule(source,
      modulePath,
      strings.classify(`${options.name}Module`),
      options.path as string);
                                                

## schematics/my-utility.ts:186:48
schematics/my-utility.ts:186:48 - error TS2345: Argument of type 'ts.SourceFile' is not assignable to parameter of type 'import("/Users/lluuccaa1gmail.com/VCS/ngrx-entity-crud/projects/ngrx-entity-crud/schematics/third_party/github.com/Microsoft/TypeScript/lib/typescript").SourceFile'.

186     const change = addRouteDeclarationToModule(source,
                                                   ~~~~~~
### per ora ho ignorato l'errore:
    projects/ngrx-entity-crud/schematics/my-utility.ts:188
    // @ts-ignore
    const change = addRouteDeclarationToModule(source,
      modulePath,
      options.routeLiteral);

## disabilitato compilazione ivy 
per evitare problemi di compatibilità viene consigliato di disabilitare la compilazione ivy
### messaggio propagato in compilazione con ivy abilitato:
******************************************************************************
It is not recommended to publish Ivy libraries to NPM repositories.
Read more here: https://v9.angular.io/guide/ivy#maintaining-library-compatibility
******************************************************************************
### correzione applicata "enableIvy": false
```
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": [
    "src/main.ts",
    "src/polyfills.ts"
  ],
  "include": [
    "src/**/*.d.ts"
  ],
  "angularCompilerOptions": {
    "enableIvy": false
  }
}
```

