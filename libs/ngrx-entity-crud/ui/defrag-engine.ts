/**
 * Motore di simulazione del "Disk Defragmenter" di Windows 98.
 *
 * È logica pura, senza DOM: il componente di rendering resta sottile e i test
 * girano in jsdom, dove `<canvas>.getContext('2d')` non è implementato.
 *
 * Il modello è quello che si vedeva a schermo: una griglia di cluster in cui i
 * dati frammentati vengono spostati uno alla volta verso l'inizio del disco,
 * lasciando spazio libero contiguo in coda. Ogni chiamata a
 * {@link necDefragStep} è un "tick": sposta al più un cluster ed espone gli
 * indici di lettura/scrittura correnti, che il renderer disegna come i due
 * blocchi lampeggianti verde/rosso della legenda originale.
 */

/**
 * Stato persistente di un cluster. I valori numerici finiscono in una
 * `Uint8Array`, quindi non vanno riordinati tra versioni.
 *
 * Lettura e scrittura non sono stati persistenti: sono la posizione corrente
 * della testina, esposta da {@link NecDefragField.readIndex} e
 * {@link NecDefragField.lastWriteIndex}.
 */
export enum NecDefragCluster {
  /** Spazio libero. */
  Free = 0,
  /** Dati non ottimizzati: i cluster che il defrag deve ancora consolidare. */
  Used = 1,
  /** Dati già consolidati a inizio disco. */
  Optimized = 2,
  /** Area danneggiata: non viene né usata né spostata. */
  Bad = 3,
  /** Dati che non verranno spostati (file di sistema). */
  Unmovable = 4,
}

/**
 * Zona del volume a cui il dato appartiene. Il defrag originale colorava i cluster
 * non ottimizzati in base a dove *dovrebbero* stare: è da qui che viene il misto
 * di ciano e teal della mappa prima della passata.
 */
export enum NecDefragBand {
  /** Inizio del volume. */
  Begin = 0,
  /** Metà del volume. */
  Middle = 1,
  /** Fine del volume. */
  End = 2,
}

/** Opzioni di generazione del disco frammentato iniziale. */
export interface NecDefragFieldOptions {
  /** Cluster per riga. Default 48. */
  cols?: number;
  /** Righe della griglia. Default 12. */
  rows?: number;
  /** Seme del generatore pseudo-casuale: stesso seme, stesso disco. Default 1. */
  seed?: number;
  /** Quota di cluster occupati, 0..1. Default 0.62. */
  density?: number;
  /** Numero di cluster danneggiati sparsi. Default 2. */
  badCount?: number;
  /** Cluster non spostabili in testa al disco (file di sistema). Default 5. */
  unmovableCount?: number;
}

/** Stato mutabile di una simulazione. Viene modificato in place a ogni tick. */
export interface NecDefragField {
  /** Cluster per riga. */
  cols: number;
  /** Righe della griglia. */
  rows: number;
  /** Stato dei cluster, `cols * rows` valori di {@link NecDefragCluster}. */
  cells: Uint8Array;
  /**
   * Zona di appartenenza di ogni cluster, `cols * rows` valori di
   * {@link NecDefragBand}. Vale solo per i cluster occupati: viaggia col dato
   * quando viene spostato ed è quello che il renderer usa per il colore.
   */
  bands: Uint8Array;
  /** Prima posizione non ancora consolidata: dove il prossimo cluster verrà scritto. */
  writeIndex: number;
  /** Cluster letto nell'ultimo tick, -1 se fermo. */
  readIndex: number;
  /** Cluster scritto nell'ultimo tick, -1 se fermo. */
  lastWriteIndex: number;
  /** Cluster occupati da consolidare all'inizio della passata. */
  usedTotal: number;
  /** Cluster già consolidati. */
  optimizedCount: number;
  /** `true` quando non c'è più nulla da spostare. */
  done: boolean;
  /** Seme usato per generare il disco. */
  seed: number;
}

/**
 * PRNG mulberry32: 32 bit di stato, deterministico e sufficiente a distribuire
 * i frammenti. Serve determinismo, non qualità crittografica.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Genera un disco frammentato deterministico: i cluster occupati sono
 * distribuiti a run di lunghezza variabile alternate a spazio libero, che è
 * ciò che produce il tipico aspetto "a codice a barre" del defrag.
 */
export function necCreateDefragField(
  options: NecDefragFieldOptions = {}
): NecDefragField {
  const cols = Math.max(1, Math.floor(options.cols ?? 48));
  const rows = Math.max(1, Math.floor(options.rows ?? 12));
  const seed = options.seed ?? 1;
  const density = clamp(options.density ?? 0.62, 0, 1);
  const total = cols * rows;
  const rnd = mulberry32(seed);

  const cells = new Uint8Array(total); // tutto Free
  const bands = new Uint8Array(total);
  const unmovable = clamp(
    Math.floor(options.unmovableCount ?? 5),
    0,
    Math.max(0, total - 1)
  );
  for (let i = 0; i < unmovable; i++) {
    cells[i] = NecDefragCluster.Unmovable;
  }

  const target = Math.round((total - unmovable) * density);
  let placed = 0;
  let i = unmovable;
  while (i < total && placed < target) {
    const usedRun = 1 + Math.floor(rnd() * 7);
    // Un frammento appartiene tutto alla stessa zona: è ciò che produce le
    // macchie di colore omogenee della mappa originale.
    const roll = rnd();
    const band =
      roll < 0.45
        ? NecDefragBand.Begin
        : roll < 0.8
        ? NecDefragBand.Middle
        : NecDefragBand.End;
    for (let k = 0; k < usedRun && i < total && placed < target; k++, i++) {
      cells[i] = NecDefragCluster.Used;
      bands[i] = band;
      placed++;
    }
    i += 1 + Math.floor(rnd() * 5); // buco tra due frammenti
  }

  const badCount = clamp(Math.floor(options.badCount ?? 2), 0, total);
  for (let b = 0; b < badCount; b++) {
    const at = unmovable + Math.floor(rnd() * Math.max(1, total - unmovable));
    if (at < total) {
      if (cells[at] === NecDefragCluster.Used) {
        placed--;
      }
      cells[at] = NecDefragCluster.Bad;
    }
  }

  return {
    cols,
    rows,
    cells,
    bands,
    writeIndex: 0,
    readIndex: -1,
    lastWriteIndex: -1,
    usedTotal: placed,
    optimizedCount: 0,
    done: placed === 0,
    seed,
  };
}

/**
 * Esegue un tick della passata di deframmentazione: consolida al più un
 * cluster e aggiorna gli indici di lettura/scrittura.
 *
 * Ritorna `false` quando la passata è finita (o era già finita), così il
 * chiamante sa quando emettere il completamento o rigenerare il disco.
 */
export function necDefragStep(field: NecDefragField): boolean {
  if (field.done) {
    return false;
  }
  const cells = field.cells;
  const total = cells.length;
  let write = field.writeIndex;

  // Salta ciò che è già a posto; un cluster occupato già in posizione viene
  // "riscritto" (consuma un tick), come faceva il defrag scorrendo il disco.
  while (write < total) {
    const state = cells[write];
    if (state === NecDefragCluster.Free) {
      break;
    }
    if (state === NecDefragCluster.Used) {
      cells[write] = NecDefragCluster.Optimized;
      field.optimizedCount++;
      field.readIndex = write;
      field.lastWriteIndex = write;
      field.writeIndex = write + 1;
      return true;
    }
    write++; // Optimized | Bad | Unmovable
  }
  field.writeIndex = write;

  if (write >= total) {
    return finish(field);
  }

  // `write` è spazio libero: cerca il prossimo frammento da tirare indietro.
  let read = -1;
  for (let j = write + 1; j < total; j++) {
    if (cells[j] === NecDefragCluster.Used) {
      read = j;
      break;
    }
  }
  if (read < 0) {
    return finish(field);
  }

  cells[read] = NecDefragCluster.Free;
  cells[write] = NecDefragCluster.Optimized;
  field.bands[write] = field.bands[read]; // la zona viaggia col dato
  field.optimizedCount++;
  field.readIndex = read;
  field.lastWriteIndex = write;
  field.writeIndex = write + 1;
  return true;
}

function finish(field: NecDefragField): boolean {
  field.done = true;
  field.readIndex = -1;
  field.lastWriteIndex = -1;
  return false;
}

/** Percentuale di completamento della passata, 0..100. */
export function necDefragProgress(field: NecDefragField): number {
  if (field.usedTotal <= 0) {
    return 100;
  }
  return clamp((field.optimizedCount / field.usedTotal) * 100, 0, 100);
}

/**
 * Avanza la simulazione finché il completamento non raggiunge `percent`: è così
 * che il progresso reale di un'operazione pilota il disegno in modalità
 * determinata. `maxSteps` è una rete di sicurezza contro loop imprevisti.
 */
export function necDefragAdvanceTo(
  field: NecDefragField,
  percent: number,
  maxSteps = field.cells.length * 2
): number {
  const target = clamp(percent, 0, 100);
  let steps = 0;
  while (steps < maxSteps && !field.done && necDefragProgress(field) < target) {
    if (!necDefragStep(field)) {
      break;
    }
    steps++;
  }
  return steps;
}

/** Porta la passata a termine, senza animazione. */
export function necDefragComplete(field: NecDefragField): void {
  necDefragAdvanceTo(field, 100);
  field.done = true;
  field.readIndex = -1;
  field.lastWriteIndex = -1;
}
