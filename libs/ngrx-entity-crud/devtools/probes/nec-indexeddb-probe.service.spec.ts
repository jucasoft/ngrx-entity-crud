import {NecIndexedDbProbeService} from './nec-indexeddb-probe.service';
import {NecIdbAdapter} from '../models';

describe('NecIndexedDbProbeService', () => {
  it('usa l\'adapter esplicito quando disponibile (path agnostico prioritario)', async () => {
    const adapter: NecIdbAdapter = {
      name: 'fake',
      isAvailable: () => true,
      listDatabases: async () => [
        {name: 'db1', version: 3, stores: [{name: 's1', count: 5}]},
      ],
    };

    const probe = new NecIndexedDbProbeService(adapter);
    const report = await probe.read();

    expect(report.available).toBe(true);
    expect(report.enumerable).toBe(true);
    expect(report.adapter).toBe('fake');
    expect(report.databases[0].stores[0].count).toBe(5);
  });

  it('ignora un adapter non disponibile e passa al path nativo', async () => {
    const adapter: NecIdbAdapter = {
      name: 'unavailable',
      isAvailable: () => false,
      listDatabases: async () => {
        throw new Error('non dovrebbe essere chiamato');
      },
    };

    const probe = new NecIndexedDbProbeService(adapter);
    const report = await probe.read([]);

    // Senza nomi DB e (in jsdom) senza databases(), il report è non enumerabile o non disponibile.
    expect(typeof report.available).toBe('boolean');
    if (report.available) {
      expect(report.enumerable).toBe(false);
      expect(report.adapter).toBe('native');
    }
  });
});
