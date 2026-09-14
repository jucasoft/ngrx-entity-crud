import {Dictionary} from '@ngrx/entity';
import {<%= clazz %>} from '@models/vo/<%= dasherize(clazz) %>';

/**
 * Gestione delle bozze locali basata su "entitiesSelected" dello store.
 *
 * Il modello e' quello previsto da ngrx-entity-crud:
 * - "entities" contiene il dato originale (quello arrivato dal server),
 * - "entitiesSelected" contiene la copia in lavorazione (la bozza),
 * - una riga e' "sporca" quando la bozza diverge dall'originale.
 *
 * Le bozze vivono solo in memoria: sopravvivono ad una nuova ricerca
 * (il reducer di SearchSuccess non azzera entitiesSelected) ma non al reload della pagina.
 */

export function isDraftDirty(draft: <%= clazz %>, origin: <%= clazz %>): boolean {
  if (!origin) {
    // la bozza non ha piu' un originale (es. elemento cancellato): la consideriamo sporca.
    return true;
  }
  // confronto strutturale sufficiente in questo contesto: la bozza nasce come copia dell'originale,
  // quindi l'ordine delle chiavi coincide.
  return JSON.stringify(draft) !== JSON.stringify(origin);
}

export function dirtyDraftIds(entities: Dictionary<<%= clazz %>>, drafts: Dictionary<<%= clazz %>>): string[] {
  return Object.keys(drafts || {}).filter(id => isDraftDirty(drafts[id], entities[id]));
}

export function dirtyDrafts(entities: Dictionary<<%= clazz %>>, drafts: Dictionary<<%= clazz %>>): <%= clazz %>[] {
  return dirtyDraftIds(entities, drafts).map(id => drafts[id]);
}
