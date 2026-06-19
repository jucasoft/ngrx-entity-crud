import {NecLocalStorageProbeService} from './nec-local-storage-probe.service';

describe('NecLocalStorageProbeService', () => {
  let probe: NecLocalStorageProbeService;

  beforeEach(() => {
    localStorage.clear();
    probe = new NecLocalStorageProbeService();
  });

  it('legge le chiavi e le ordina per dimensione UTF-16 decrescente', () => {
    localStorage.setItem('a', 'x'); // (1+1)*2 = 4
    localStorage.setItem('bigKey', 'xxxxxx'); // (6+6)*2 = 24

    const report = probe.read('local');

    expect(report.available).toBe(true);
    expect(report.count).toBe(2);
    expect(report.entries[0].key).toBe('bigKey');
    expect(report.entries[0].bytesUtf16).toBe(24);
    expect(report.entries[1].bytesUtf16).toBe(4);
    expect(report.totalBytesUtf16).toBe(28);
    expect(report.entries[0].bytesUtf8).toBeGreaterThan(0);
  });

  it('ritorna un report disponibile ma vuoto senza chiavi', () => {
    const report = probe.read('local');
    expect(report.available).toBe(true);
    expect(report.count).toBe(0);
    expect(report.totalBytesUtf16).toBe(0);
  });

  it('estimate() degrada senza lanciare quando manca navigator.storage', async () => {
    const est = await probe.estimate();
    expect(est).toHaveProperty('available');
    expect(typeof est.available).toBe('boolean');
  });

  it('readValue() legge on-demand il valore grezzo (o null se assente)', () => {
    localStorage.setItem('theme', 'dark');
    expect(probe.readValue('theme')).toBe('dark');
    expect(probe.readValue('inesistente')).toBeNull();
  });
});
