=== COMPILE LIBRARY ===
compilare la libreria e schematics:
```
npm run buildLibsSchematics
```
publicare libreria:
posizionarsi nella cartella libs/ngrx-entity-crud

```
npm login (inserire autenticazione npm)
npm publish 
```

=== SVILUPPO ===
per poter lavorare con la libreria in fase di sviluppo senza doverla ogni volta ripublicare, utilizzare il comando:
```
cd <library-compiled>
npm link
```
posizionarsi nella cartella del progetto dove si vuole utilizzare le libreria e lanciare il comando:
```
npm link <library-name>
```

== eventuali errori ==
- errore allo start up dell'applicazione:   

```
... 'No provider for Injector!' ...
```
ho risolto modificando le impostazioni "projects/*/architect/build/options" del file angular.json:
"preserveSymlinks": true

- non si vedono le modifiche apportate alla libreria:   
ho tolto il riferimento alla libreria nel file package.json e rieseguito "npm link <library-name>"

