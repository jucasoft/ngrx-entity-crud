import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { TableModule } from 'primeng/table';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { NecFormClipboardService } from './nec-form-clipboard.service';
import { NecFormClipboardField } from './models';
import { necAllSelected, necToggleAll, necToggleItem } from './selection';

/**
 * Dialog di esportazione dei criteri di ricerca: riepilogo dei campi del form
 * in una `p-table` con checkbox per riga (tutte selezionate di default),
 * anteprima del JSON risultante e copia negli appunti.
 *
 * Standalone, OnPush, costruito su componenti **PrimeNG** con gli idiomi
 * compatibili 16-22 (classi `p-button-*`, direttive strutturali classiche,
 * `<textarea>` nativa perché `pInputTextarea`/`pTextarea` cambiano nome tra
 * le major; `p-checkbox` gestite dal componente perché i selettori di
 * `p-tableCheckbox`/`p-tableHeaderCheckbox` cambiano in v22, vedi `selection.ts`;
 * template con `pTemplate` + `#ref`, letti rispettivamente da v16-21 e v22).
 * Da aprire via `DialogService` (DynamicDialog):
 *
 * ```ts
 * this.dialogService.open(NecFormDataExportDialogComponent, {
 *   header: 'Copy form data',
 *   width: '42rem',
 *   data: {componentName: this.component_name, formData: form.getRawValue()},
 * });
 * ```
 *
 * Alla copia chiude con `{copied: true, count}`.
 */
@Component({
  selector: 'nec-form-data-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CheckboxModule,
    TableModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .nec-json {
        width: 100%;
        margin-top: 12px;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        box-sizing: border-box;
        font-family: monospace;
        font-size: 12px;
      }
      .nec-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }
    `,
  ],
  template: `
    <p-table [value]="fields" styleClass="p-datatable-sm">
      <ng-template pTemplate="header" #header>
        <tr>
          <th style="width: 3rem">
            <p-checkbox
              [binary]="true"
              [ngModel]="allSelected"
              (onChange)="toggleAll()"
              ariaLabel="Select all fields"
            ></p-checkbox>
          </th>
          <th>Field</th>
          <th>Value</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" #body let-field>
        <tr>
          <td>
            <p-checkbox
              [binary]="true"
              [ngModel]="isSelected(field)"
              (onChange)="toggle(field)"
              [ariaLabel]="'Select ' + field.label"
            ></p-checkbox>
          </td>
          <td>{{ field.label }}</td>
          <td>{{ field.summary }}</td>
        </tr>
      </ng-template>
    </p-table>

    <textarea
      class="nec-json"
      readonly
      rows="8"
      [value]="previewJson"
      aria-label="JSON preview"
    ></textarea>

    <div class="nec-actions">
      <button
        type="button"
        pButton
        class="p-button-text"
        label="Cancel"
        (click)="cancel()"
      ></button>
      <button
        type="button"
        pButton
        icon="pi pi-copy"
        label="Copy"
        [disabled]="selection.length === 0"
        (click)="copy()"
      ></button>
    </div>
  `,
})
export class NecFormDataExportDialogComponent implements OnInit {
  fields: NecFormClipboardField[] = [];
  selection: NecFormClipboardField[] = [];

  constructor(
    private readonly formClipboard: NecFormClipboardService,
    private readonly config: DynamicDialogConfig,
    private readonly ref: DynamicDialogRef
  ) {}

  ngOnInit(): void {
    this.fields = this.formClipboard.toFields(this.config.data.formData);
    this.selection = [...this.fields];
  }

  get allSelected(): boolean {
    return necAllSelected(this.fields, this.selection);
  }

  isSelected(field: NecFormClipboardField): boolean {
    return this.selection.includes(field);
  }

  toggle(field: NecFormClipboardField): void {
    this.selection = necToggleItem(this.fields, this.selection, field);
  }

  toggleAll(): void {
    this.selection = necToggleAll(this.fields, this.selection);
  }

  get previewJson(): string {
    return this.formClipboard.serialize(
      this.formClipboard.buildPayload(
        this.config.data.componentName,
        this.config.data.formData,
        this.selection
      )
    );
  }

  copy(): void {
    if (this.formClipboard.copy(this.previewJson)) {
      this.ref.close({ copied: true, count: this.selection.length });
    }
  }

  cancel(): void {
    this.ref.close();
  }
}
