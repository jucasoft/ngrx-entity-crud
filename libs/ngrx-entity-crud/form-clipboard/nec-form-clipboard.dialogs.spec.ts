import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NecFormClipboardService } from './nec-form-clipboard.service';
import { NecFormDataExportDialogComponent } from './nec-form-data-export-dialog.component';
import { NecFormDataImportDialogComponent } from './nec-form-data-import-dialog.component';

const COMPONENT_NAME = 'ProductBrowserSearchComponent';

/**
 * Checkbox di selezione delle righe: `p-checkbox` (selettore identico tra PrimeNG 16 e 22) al
 * posto di `p-tableCheckbox`/`p-tableHeaderCheckbox` (camelCase fino a v21, kebab in v22).
 * La prima è quella dell'header. Il click passa dall'output `onChange`, comune alle major.
 */
function checkboxes(fixture: ComponentFixture<unknown>) {
  return fixture.debugElement.queryAll(By.css('p-checkbox'));
}

function divergentCheckboxes(
  fixture: ComponentFixture<unknown>
): Element | null {
  return (fixture.nativeElement as HTMLElement).querySelector(
    'p-tablecheckbox, p-table-checkbox, p-tableheadercheckbox, p-table-header-checkbox'
  );
}

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
        name: {
          fieldValue: 'bitcoin',
          operator: '=',
          enabled: true,
          type: 'string',
        },
      },
      conditionsLog: {},
    },
  },
};

describe('NecFormDataExportDialogComponent', () => {
  let ref: { close: jest.Mock };
  let service: NecFormClipboardService;

  beforeEach(() => {
    ref = { close: jest.fn() };
    TestBed.configureTestingModule({
      imports: [NecFormDataExportDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: DynamicDialogConfig,
          useValue: { data: { componentName: COMPONENT_NAME, formData } },
        },
        { provide: DynamicDialogRef, useValue: ref },
      ],
    });
    service = TestBed.inject(NecFormClipboardService);
  });

  it('mostra tutte le righe selezionate e il JSON dei soli campi scelti', () => {
    const fixture = TestBed.createComponent(NecFormDataExportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.fields.length).toBe(2);
    expect(component.selection.length).toBe(2);
    expect(component.previewJson).toContain(COMPONENT_NAME);
    expect(component.previewJson).toContain('bitcoin');

    component.selection = component.selection.filter(
      (field) => field.label !== 'name'
    );
    expect(component.previewJson).not.toContain('bitcoin');
    expect(component.previewJson).toContain('startDate');
  });

  it('copy copia l\'anteprima e chiude con {copied: true}', () => {
    jest.spyOn(service, 'copy').mockReturnValue(true);
    const fixture = TestBed.createComponent(NecFormDataExportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.copy();

    expect(service.copy).toHaveBeenCalledWith(component.previewJson);
    expect(ref.close).toHaveBeenCalledWith({ copied: true, count: 2 });
  });

  it('una p-checkbox per riga piu\' quella dell\'header, senza checkbox di tabella', () => {
    const fixture = TestBed.createComponent(NecFormDataExportDialogComponent);
    fixture.detectChanges();

    expect(checkboxes(fixture).length).toBe(3);
    expect(divergentCheckboxes(fixture)).toBeNull();
  });

  it('la checkbox di riga toglie il campo dalla selezione e dal JSON', () => {
    const fixture = TestBed.createComponent(NecFormDataExportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    // righe nell'ordine di fields: [startDate, name]
    checkboxes(fixture)[2].triggerEventHandler('onChange', { checked: false });
    fixture.detectChanges();

    expect(component.selection.map((field) => field.label)).toEqual([
      'startDate',
    ]);
    expect(component.previewJson).not.toContain('bitcoin');
  });

  it('la checkbox dell\'header alterna nessuna/tutte le righe', () => {
    const fixture = TestBed.createComponent(NecFormDataExportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    checkboxes(fixture)[0].triggerEventHandler('onChange', { checked: false });
    fixture.detectChanges();
    expect(component.selection).toEqual([]);

    checkboxes(fixture)[0].triggerEventHandler('onChange', { checked: true });
    fixture.detectChanges();
    expect(component.selection).toEqual(component.fields);
  });
});

describe('NecFormDataImportDialogComponent', () => {
  let ref: { close: jest.Mock };
  let service: NecFormClipboardService;

  beforeEach(() => {
    ref = { close: jest.fn() };
    TestBed.configureTestingModule({
      imports: [NecFormDataImportDialogComponent, NoopAnimationsModule],
      providers: [
        {
          provide: DynamicDialogConfig,
          useValue: {
            data: { componentName: COMPONENT_NAME, currentFormData: formData },
          },
        },
        { provide: DynamicDialogRef, useValue: ref },
      ],
    });
    service = TestBed.inject(NecFormClipboardService);
    // niente lettura clipboard reale nei test
    jest.spyOn(service, 'tryReadClipboard').mockResolvedValue(null);
  });

  function validText(componentName: string = COMPONENT_NAME): string {
    return service.serialize({ v: 1, componentName, formData });
  }

  it('con un payload valido popola la tabella e il confronto col form', () => {
    const fixture = TestBed.createComponent(NecFormDataImportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.text = validText();
    component.parse();

    expect(component.error).toBeNull();
    expect(component.fields.length).toBe(2);
    expect(component.selection.length).toBe(2);
    expect(component.fields[0].currentSummary).toBe('>= 2026-01-01');
  });

  it('blocca il payload di un altro form', () => {
    const fixture = TestBed.createComponent(NecFormDataImportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.text = validText('CoinSearchComponent');
    component.parse();

    expect(component.error).toContain('CoinSearchComponent');
    expect(component.fields.length).toBe(0);
  });

  it('segnala il JSON non valido', () => {
    const fixture = TestBed.createComponent(NecFormDataImportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.text = 'non-json';
    component.parse();

    expect(component.error).toBe('Invalid JSON');
  });

  it('apply riconsegna un Date per le condizioni di tipo date', () => {
    const fixture = TestBed.createComponent(NecFormDataImportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.text = service.serialize({
      v: 1,
      componentName: COMPONENT_NAME,
      formData: {
        conditionMap: {
          test: {
            conditions: {
              startDate: {
                fieldValue: new Date('2026-06-30T22:00:00.000Z'),
                operator: '=',
                enabled: true,
                type: 'date',
              },
            },
          },
        },
      },
    });
    component.parse();
    component.apply();

    const closed = ref.close.mock.calls[0][0];
    const fieldValue =
      closed.formData.conditionMap.test.conditions.startDate.fieldValue;
    expect(fieldValue instanceof Date).toBe(true);
    expect(fieldValue.getTime()).toBe(
      new Date('2026-06-30T22:00:00.000Z').getTime()
    );
  });

  it('apply chiude con il form value dei soli campi selezionati', () => {
    const fixture = TestBed.createComponent(NecFormDataImportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.text = validText();
    component.parse();
    component.selection = component.selection.filter(
      (field) => field.label === 'name'
    );
    component.apply();

    expect(ref.close).toHaveBeenCalledWith({
      formData: {
        conditionMap: {
          test: {
            conditions: {
              name: {
                fieldValue: 'bitcoin',
                operator: '=',
                enabled: true,
                type: 'string',
              },
            },
          },
        },
      },
      count: 1,
    });
  });

  it('checkbox di riga e dell\'header pilotano la selezione da applicare', () => {
    const fixture = TestBed.createComponent(NecFormDataImportDialogComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    // come l'utente (incolla nella textarea): l'evento marca la view OnPush da ridisegnare
    const textarea = (fixture.nativeElement as HTMLElement).querySelector(
      'textarea'
    ) as HTMLTextAreaElement;
    textarea.value = validText();
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(checkboxes(fixture).length).toBe(3);
    expect(divergentCheckboxes(fixture)).toBeNull();

    // righe nell'ordine di fields: [startDate, name]
    checkboxes(fixture)[1].triggerEventHandler('onChange', { checked: false });
    fixture.detectChanges();
    expect(component.selection.map((field) => field.label)).toEqual(['name']);

    checkboxes(fixture)[0].triggerEventHandler('onChange', { checked: true });
    fixture.detectChanges();
    expect(component.selection).toEqual(component.fields);
  });
});
