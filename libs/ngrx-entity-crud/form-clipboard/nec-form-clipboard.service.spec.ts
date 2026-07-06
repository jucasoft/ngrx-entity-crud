import {NecFormClipboardService} from './nec-form-clipboard.service';

describe('NecFormClipboardService', () => {
  let service: NecFormClipboardService;

  // form value realistico di una search view (condizioni + campo mai toccato)
  const formData: Record<string, unknown> = {
    conditionMap: {
      test: {
        conditions: {
          startDate: {
            fieldValue: '2026-01-01',
            operator: '>=',
            enabled: true,
            type: 'date',
          },
          active: {fieldValue: 1, operator: '=', enabled: false, type: 'number'},
          name: '',
        },
        conditionsLog: {},
      },
    },
  };

  beforeEach(() => {
    service = new NecFormClipboardService();
  });

  it('toFields appiattisce il form value in una riga per foglia', () => {
    const fields = service.toFields(formData);
    expect(fields.map((field) => field.path)).toEqual([
      'conditionMap.test.conditions.startDate',
      'conditionMap.test.conditions.active',
      'conditionMap.test.conditions.name',
    ]);
    expect(fields[0].label).toBe('startDate');
    expect(fields[0].summary).toBe('>= 2026-01-01');
    expect(fields[1].summary).toBe('= 1 (off)');
    expect(fields[2].summary).toBe('—');
  });

  it('toFields valorizza currentSummary dal form corrente', () => {
    const current: Record<string, unknown> = {
      conditionMap: {
        test: {
          conditions: {
            startDate: {
              fieldValue: '2020-12-31',
              operator: '=',
              enabled: true,
              type: 'date',
            },
            active: '',
            name: '',
          },
          conditionsLog: {},
        },
      },
    };
    const fields = service.toFields(formData, current);
    expect(fields[0].currentSummary).toBe('= 2020-12-31');
    expect(fields[1].currentSummary).toBe('—');
  });

  it('buildPayload include solo i campi selezionati e fa round-trip', () => {
    const fields = service.toFields(formData);
    const selected = fields.filter((field) => field.label !== 'active');
    const payload = service.buildPayload('SearchComponent', formData, selected);

    const conditions = (payload.formData as any).conditionMap.test.conditions;
    expect(conditions.active).toBeUndefined();
    expect(conditions.startDate.fieldValue).toBe('2026-01-01');

    const result = service.parse(service.serialize(payload));
    expect(result.error).toBeUndefined();
    expect(result.payload?.componentName).toBe('SearchComponent');
    expect(result.payload?.formData).toEqual(payload.formData);
  });

  it('parse segnala JSON non valido e payload non riconosciuto', () => {
    expect(service.parse('non-json').error).toBe('Invalid JSON');
    expect(service.parse('{"foo": 1}').error).toContain('Unrecognized payload');
    expect(service.parse('"stringa"').error).toContain('Unrecognized payload');
  });

  it('reviveDates riconverte in Date le stringhe ISO dei campi date', () => {
    const revived = service.reviveDates({
      a: {
        fieldValue: '2026-06-30T22:00:00.000Z',
        operator: '=',
        enabled: true,
        type: 'date',
      },
      b: {fieldValue: '2026-06-30', operator: '=', enabled: true, type: 'date'},
      c: {fieldValue: 'x', operator: '=', enabled: true, type: 'string'},
    }) as any;
    expect(revived.a.fieldValue instanceof Date).toBe(true);
    expect(revived.a.fieldValue.getTime()).toBe(
      new Date('2026-06-30T22:00:00.000Z').getTime()
    );
    expect(revived.b.fieldValue).toBe('2026-06-30');
    expect(revived.c.fieldValue).toBe('x');
  });

  it('prune ignora i path non presenti nel sorgente', () => {
    const result = service.prune(formData, [
      'conditionMap.test.conditions.startDate',
      'conditionMap.missing.conditions.x',
    ]) as any;
    expect(result.conditionMap.test.conditions.startDate).toBeDefined();
    expect(result.conditionMap.missing).toBeUndefined();
  });
});
