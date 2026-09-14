import {
  NecDefragBand,
  NecDefragCluster,
  NecDefragField,
  necCreateDefragField,
  necDefragAdvanceTo,
  necDefragComplete,
  necDefragProgress,
  necDefragStep,
} from './defrag-engine';

function count(field: NecDefragField, state: NecDefragCluster): number {
  let n = 0;
  for (let i = 0; i < field.cells.length; i++) {
    if (field.cells[i] === state) {
      n++;
    }
  }
  return n;
}

function runToEnd(field: NecDefragField, maxSteps = 10000): number {
  let steps = 0;
  while (necDefragStep(field) && steps < maxSteps) {
    steps++;
  }
  return steps;
}

describe('defrag-engine', () => {
  describe('necCreateDefragField', () => {
    it('genera lo stesso disco a parità di seme', () => {
      const a = necCreateDefragField({ cols: 20, rows: 5, seed: 7 });
      const b = necCreateDefragField({ cols: 20, rows: 5, seed: 7 });
      expect(Array.from(a.cells)).toEqual(Array.from(b.cells));
      expect(a.usedTotal).toBe(b.usedTotal);
    });

    it('genera dischi diversi con semi diversi', () => {
      const a = necCreateDefragField({ cols: 20, rows: 5, seed: 1 });
      const b = necCreateDefragField({ cols: 20, rows: 5, seed: 2 });
      expect(Array.from(a.cells)).not.toEqual(Array.from(b.cells));
    });

    it('mette i cluster non spostabili in testa e frammenta il resto', () => {
      const field = necCreateDefragField({
        cols: 20,
        rows: 5,
        seed: 3,
        unmovableCount: 4,
      });
      for (let i = 0; i < 4; i++) {
        expect(field.cells[i]).toBe(NecDefragCluster.Unmovable);
      }
      expect(field.usedTotal).toBeGreaterThan(0);
      // frammentato: c'è almeno un buco prima dell'ultimo cluster occupato
      const last = field.cells.lastIndexOf(NecDefragCluster.Used);
      const firstFreeAfterUnmovable = field.cells.indexOf(
        NecDefragCluster.Free,
        4
      );
      expect(firstFreeAfterUnmovable).toBeGreaterThan(-1);
      expect(firstFreeAfterUnmovable).toBeLessThan(last);
    });

    it('assegna una zona di appartenenza a ogni frammento', () => {
      const field = necCreateDefragField({ cols: 40, rows: 10, seed: 17 });
      const bands = new Set<number>();
      for (let i = 0; i < field.cells.length; i++) {
        if (field.cells[i] === NecDefragCluster.Used) {
          bands.add(field.bands[i]);
          expect(field.bands[i]).toBeGreaterThanOrEqual(NecDefragBand.Begin);
          expect(field.bands[i]).toBeLessThanOrEqual(NecDefragBand.End);
        }
      }
      // la mappa "prima" mescola le tre zone: è ciò che le dà il suo aspetto
      expect(bands.size).toBe(3);
    });

    it('è già completo quando non ci sono dati da spostare', () => {
      const field = necCreateDefragField({ cols: 10, rows: 2, density: 0 });
      expect(field.usedTotal).toBe(0);
      expect(field.done).toBe(true);
      expect(necDefragProgress(field)).toBe(100);
      expect(necDefragStep(field)).toBe(false);
    });
  });

  describe('necDefragStep', () => {
    it('conserva il numero di cluster occupati a ogni tick', () => {
      const field = necCreateDefragField({ cols: 24, rows: 6, seed: 11 });
      const expected = field.usedTotal;
      let guard = 0;
      while (necDefragStep(field) && guard++ < 5000) {
        const alive =
          count(field, NecDefragCluster.Used) +
          count(field, NecDefragCluster.Optimized);
        expect(alive).toBe(expected);
      }
    });

    it('non tocca i cluster danneggiati né quelli non spostabili', () => {
      const field = necCreateDefragField({
        cols: 24,
        rows: 6,
        seed: 5,
        badCount: 3,
        unmovableCount: 6,
      });
      const bad = count(field, NecDefragCluster.Bad);
      const unmovable = count(field, NecDefragCluster.Unmovable);
      const badPositions = Array.from(field.cells)
        .map((state, index) => ({ state, index }))
        .filter((c) => c.state === NecDefragCluster.Bad)
        .map((c) => c.index);

      runToEnd(field);

      expect(count(field, NecDefragCluster.Bad)).toBe(bad);
      expect(count(field, NecDefragCluster.Unmovable)).toBe(unmovable);
      badPositions.forEach((index) =>
        expect(field.cells[index]).toBe(NecDefragCluster.Bad)
      );
    });

    it('consolida tutti i dati a inizio disco e arriva al 100%', () => {
      const field = necCreateDefragField({ cols: 30, rows: 8, seed: 42 });
      const steps = runToEnd(field);

      expect(steps).toBeGreaterThan(0);
      expect(field.done).toBe(true);
      expect(count(field, NecDefragCluster.Used)).toBe(0);
      expect(count(field, NecDefragCluster.Optimized)).toBe(field.usedTotal);
      expect(necDefragProgress(field)).toBe(100);

      // nessun dato consolidato resta dopo un buco di spazio libero
      const firstFree = field.cells.indexOf(NecDefragCluster.Free);
      if (firstFree > -1) {
        expect(field.cells.indexOf(NecDefragCluster.Optimized, firstFree)).toBe(
          -1
        );
      }
    });

    it('porta la zona di appartenenza insieme al dato spostato', () => {
      const field = necCreateDefragField({ cols: 24, rows: 6, seed: 8 });
      // primo buco e primo frammento a destra di esso
      const write = field.cells.indexOf(NecDefragCluster.Free);
      let read = -1;
      for (let j = write + 1; j < field.cells.length; j++) {
        if (field.cells[j] === NecDefragCluster.Used) {
          read = j;
          break;
        }
      }
      expect(read).toBeGreaterThan(write);
      const band = field.bands[read];

      while (field.writeIndex < write) {
        necDefragStep(field);
      }
      necDefragStep(field);

      expect(field.cells[write]).toBe(NecDefragCluster.Optimized);
      expect(field.bands[write]).toBe(band);
    });

    it('azzera gli indici della testina quando ha finito', () => {
      const field = necCreateDefragField({ cols: 12, rows: 3, seed: 9 });
      runToEnd(field);
      expect(field.readIndex).toBe(-1);
      expect(field.lastWriteIndex).toBe(-1);
      expect(necDefragStep(field)).toBe(false);
    });
  });

  describe('necDefragAdvanceTo', () => {
    it('avanza fino alla percentuale richiesta e non oltre', () => {
      const field = necCreateDefragField({ cols: 30, rows: 8, seed: 13 });
      necDefragAdvanceTo(field, 50);

      expect(necDefragProgress(field)).toBeGreaterThanOrEqual(50);
      expect(field.done).toBe(false);
      // il tick che supera la soglia è l'ultimo: niente corse in avanti
      expect(necDefragProgress(field)).toBeLessThan(
        50 + (100 / field.usedTotal) * 2
      );
    });

    it('è idempotente se il target è già raggiunto', () => {
      const field = necCreateDefragField({ cols: 20, rows: 5, seed: 4 });
      necDefragAdvanceTo(field, 40);
      const snapshot = field.optimizedCount;
      expect(necDefragAdvanceTo(field, 40)).toBe(0);
      expect(field.optimizedCount).toBe(snapshot);
    });
  });

  describe('necDefragComplete', () => {
    it('porta la passata a termine senza animazione', () => {
      const field = necCreateDefragField({ cols: 30, rows: 8, seed: 21 });
      necDefragComplete(field);
      expect(field.done).toBe(true);
      expect(necDefragProgress(field)).toBe(100);
      expect(count(field, NecDefragCluster.Used)).toBe(0);
    });
  });
});
