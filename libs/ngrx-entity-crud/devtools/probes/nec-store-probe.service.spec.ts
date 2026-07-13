import {TestBed} from '@angular/core/testing';
import {Store} from '@ngrx/store';
import {of} from 'rxjs';
import {NecStoreProbeService} from './nec-store-probe.service';

describe('NecStoreProbeService', () => {
  const rootState = {
    coin: {isLoading: false, isLoaded: true, error: '', responses: [1, 2], ids: ['a', 'b'], entities: {}},
    profile: {isLoading: true, isLoaded: false, error: '', responses: [], item: {}},
    router: {state: {}}, // non-CRUD: niente isLoading boolean -> ignorata
    settings: {isLoading: false, isLoaded: false, error: 'boom', responses: []}, // né ids né item -> unknown
  };

  let probe: NecStoreProbeService;
  let dispatch: jest.Mock;

  beforeEach(() => {
    dispatch = jest.fn();
    const fakeStore = {
      select: (projector: (s: any) => any) => of(projector(rootState)),
      dispatch,
    } as unknown as Store;

    TestBed.configureTestingModule({
      providers: [NecStoreProbeService, {provide: Store, useValue: fakeStore}],
    });
    probe = TestBed.inject(NecStoreProbeService);
  });

  it('enumera le slice CRUD per convenzione, ordinate ed escludendo le non-CRUD', () => {
    const r = probe.read();
    expect(r.slices.map((s) => s.key)).toEqual(['coin', 'profile', 'settings']);
  });

  it('mountedKeys espone TUTTE le chiavi root, incluse le non-CRUD e le escluse dai filtri', () => {
    // `router` non è una slice CRUD (niente isLoading) ma È montata: serve alle correlazioni.
    expect(probe.read().mountedKeys).toEqual(['coin', 'profile', 'router', 'settings']);
    // blacklist/whitelist filtrano solo la vista `slices`, non la verità dello stato root.
    const filtered = probe.read({blacklist: ['coin']});
    expect(filtered.slices.map((s) => s.key)).toEqual(['profile', 'settings']);
    expect(filtered.mountedKeys).toContain('coin');
  });

  it('mountedEntityCounts espone i conteggi delle plural anche se escluse dai filtri', () => {
    // Sorgente della colonna "entities" del pannello Live grids: una slice in blacklist è
    // comunque montata, quindi il suo conteggio deve restare visibile alle correlazioni.
    const filtered = probe.read({blacklist: ['coin']});
    expect(filtered.slices.map((s) => s.key)).toEqual(['profile', 'settings']);
    expect(filtered.mountedEntityCounts?.['coin']).toBe(2);
    // le singular non hanno entityCount: assenti dalla mappa, non 0
    expect(filtered.mountedEntityCounts).not.toHaveProperty('profile');
  });

  it('classifica kind e conteggi (plural/singular/unknown)', () => {
    const r = probe.read();

    const coin = r.slices.find((s) => s.key === 'coin');
    expect(coin?.kind).toBe('plural');
    expect(coin?.entityCount).toBe(2);
    expect(coin?.responsesCount).toBe(2);

    const profile = r.slices.find((s) => s.key === 'profile');
    expect(profile?.kind).toBe('singular');
    expect(profile?.entityCount).toBeUndefined();
    expect(profile?.isLoading).toBe(true);

    const settings = r.slices.find((s) => s.key === 'settings');
    expect(settings?.kind).toBe('unknown');
  });

  it('calcola hasData (entità, item singolare o response)', () => {
    const r = probe.read();
    // coin: 2 entità + 2 response -> true
    expect(r.slices.find((s) => s.key === 'coin')?.hasData).toBe(true);
    // profile: singular con item presente -> true
    expect(r.slices.find((s) => s.key === 'profile')?.hasData).toBe(true);
    // settings: né ids né item né response -> false
    expect(r.slices.find((s) => s.key === 'settings')?.hasData).toBe(false);
  });

  it('raccoglie loadingNames ed errori', () => {
    const r = probe.read();
    expect(r.loadingNames).toEqual(['profile']);
    expect(r.errors).toEqual(['settings: boom']);
  });

  it('rispetta la whitelist', () => {
    const r = probe.read({whitelist: ['coin']});
    expect(r.slices.map((s) => s.key)).toEqual(['coin']);
  });

  it('costruisce i type delle azioni di reset dalla sola slice key', () => {
    expect(probe.resetActionType('coin')).toBe('[coin] Reset');
    expect(probe.resetResponsesActionType('coin')).toBe('[coin] Reset Response');
  });

  it('reset(key) dispaccia [key] Reset', () => {
    probe.reset('coin');
    expect(dispatch).toHaveBeenCalledWith({type: '[coin] Reset'});
  });

  it('resetResponses(key) dispaccia [key] Reset Response', () => {
    probe.resetResponses('coin');
    expect(dispatch).toHaveBeenCalledWith({type: '[coin] Reset Response'});
  });

  it('correla con lazy-report.json e propaga generatedAt', async () => {
    const lazyJson = {
      generatedAt: '2026-06-19T10:00:00.000Z',
      stores: [
        {name: 'coin', isLazyCandidate: false, lazyRoute: true, sections: ['coins'], verdict: 'x'},
        {name: 'order', isLazyCandidate: true, lazyRoute: true, sections: ['orders'], verdict: 'lazy candidate'},
      ],
    };
    const originalFetch = (global as any).fetch;
    (global as any).fetch = jest.fn().mockResolvedValue({ok: true, json: async () => lazyJson});
    try {
      const r = await probe.readWithLazyReport('assets/lazy-report.json');
      expect(r.lazyReportGeneratedAt).toBe('2026-06-19T10:00:00.000Z');

      const coin = r.lazy?.find((l) => l.name === 'coin');
      expect(coin?.runtimeStatus).toBe('loaded'); // 'coin' è una slice montata

      const order = r.lazy?.find((l) => l.name === 'order');
      expect(order?.runtimeStatus).toBe('lazy-not-loaded'); // non montato ma candidato
    } finally {
      (global as any).fetch = originalFetch;
    }
  });
});
