/**
 * Secondary entry-point `ngrx-entity-crud/form-clipboard`.
 *
 * Copia/incolla dei criteri di un form di ricerca con selezione dei campi:
 * l'utente esporta i criteri come JSON leggibile (envelope
 * `{v, componentName, formData}`) da passare a un collega o all'assistenza,
 * che li reimporta riproducendo la stessa ricerca. Due dialog PrimeNG
 * (DynamicDialog) + un servizio di serializzazione/validazione. Richiede
 * `primeng` + `primeicons` nell'app consumer (peerDependencies opzionali).
 * Tree-shakable: chi non lo importa non lo paga nel bundle.
 */

export * from './models';
export * from './nec-form-clipboard.service';
export * from './nec-form-data-export-dialog.component';
export * from './nec-form-data-import-dialog.component';
