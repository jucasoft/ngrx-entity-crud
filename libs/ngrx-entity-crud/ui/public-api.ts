/**
 * Secondary entry-point `ngrx-entity-crud/ui`.
 *
 * Componenti di presentazione senza dipendenze dal resto della libreria né da
 * PrimeNG. Oggi contiene `<nec-defrag-loader>`, l'indicatore di operazione in
 * corso in stile "Disk Defragmenter" di Windows 98, con il motore di
 * simulazione riusabile a parte. Tree-shakable: chi non lo importa non lo paga
 * nel bundle.
 */

export * from './defrag-engine';
export * from './nec-defrag-loader.component';
