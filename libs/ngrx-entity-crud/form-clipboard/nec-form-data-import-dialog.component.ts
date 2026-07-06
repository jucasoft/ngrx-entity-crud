import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {NecFormClipboardService} from './nec-form-clipboard.service';
import {NecFormClipboardField} from './models';

/**
 * Dialog di importazione dei criteri di ricerca: textarea per il JSON
 * ricevuto (precompilata dagli appunti quando il browser lo consente,
 * altrimenti Ctrl+V), riepilogo dei campi del payload in una `p-table` con
 * checkbox per riga e confronto col valore attuale del form; validazione
 * live (JSON, `componentName`) con messaggio inline nativo (`p-message` non
 * è utilizzabile: la classe è stata rinominata `UIMessage` → `Message` tra
 * PrimeNG 16 e 19, quindi il partial-linking fallirebbe su una delle due).
 *
 * Standalone, OnPush, idiomi PrimeNG compatibili 16+. Da aprire via
 * `DialogService` (DynamicDialog):
 *
 * ```ts
 * this.dialogService.open(NecFormDataImportDialogComponent, {
 *   header: 'Paste form data',
 *   width: '42rem',
 *   data: {
 *     componentName: this.component_name,
 *     currentFormData: form.getRawValue(),
 *   },
 * });
 * ```
 *
 * All'apply chiude con `{formData, count}`: il form value parziale dei soli
 * campi selezionati (Date ricostruiti), pronto per `form.patchValue(...)`.
 */
@Component({
  selector: 'nec-form-data-import-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
      }
      .nec-json {
        width: 100%;
        padding: 8px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        box-sizing: border-box;
        font-family: monospace;
        font-size: 12px;
      }
      .nec-error {
        margin-top: 8px;
        padding: 8px 12px;
        border: 1px solid #f5c2c7;
        border-radius: 4px;
        background: #fff5f5;
        color: #b02a37;
        font-size: 13px;
      }
      .nec-table {
        display: block;
        margin-top: 12px;
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
    <textarea
      class="nec-json"
      rows="6"
      placeholder="Paste here (Ctrl+V) the JSON you received"
      aria-label="JSON payload"
      [(ngModel)]="text"
      (ngModelChange)="parse()"
    ></textarea>

    <div class="nec-error" role="alert" *ngIf="error">{{ error }}</div>

    <p-table
      *ngIf="fields.length > 0"
      class="nec-table"
      [value]="fields"
      [(selection)]="selection"
      dataKey="path"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="header">
        <tr>
          <th style="width: 3rem">
            <p-tableHeaderCheckbox></p-tableHeaderCheckbox>
          </th>
          <th>Field</th>
          <th>Value</th>
          <th>Current value</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-field>
        <tr>
          <td>
            <p-tableCheckbox [value]="field"></p-tableCheckbox>
          </td>
          <td>{{ field.label }}</td>
          <td>{{ field.summary }}</td>
          <td>{{ field.currentSummary }}</td>
        </tr>
      </ng-template>
    </p-table>

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
        icon="pi pi-check"
        label="Apply"
        [disabled]="!!error || selection.length === 0"
        (click)="apply()"
      ></button>
    </div>
  `,
})
export class NecFormDataImportDialogComponent implements OnInit {
  text = '';
  error: string | null = null;
  fields: NecFormClipboardField[] = [];
  selection: NecFormClipboardField[] = [];

  // formData del payload con i Date ricostruiti (JSON li appiattisce in ISO)
  private revivedFormData: Record<string, unknown> | null = null;

  constructor(
    private readonly formClipboard: NecFormClipboardService,
    private readonly config: DynamicDialogConfig,
    private readonly ref: DynamicDialogRef,
    private readonly cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.formClipboard.tryReadClipboard().then((text) => {
      // precompilo solo se gli appunti contengono un payload riconoscibile
      // e l'utente non ha già iniziato a scrivere
      if (!text || this.text || !this.formClipboard.parse(text).payload) {
        return;
      }
      this.text = text;
      this.parse();
      this.cd.markForCheck();
    });
  }

  parse(): void {
    this.revivedFormData = null;
    this.fields = [];
    this.selection = [];
    this.error = null;

    if (!this.text || this.text.trim() === '') {
      return;
    }

    const {payload, error} = this.formClipboard.parse(this.text);
    if (error || !payload) {
      this.error = error || 'Unrecognized payload';
      return;
    }
    if (payload.componentName !== this.config.data.componentName) {
      this.error =
        `The payload belongs to "${payload.componentName}", ` +
        `not to this form ("${this.config.data.componentName}")`;
      return;
    }
    this.revivedFormData = this.formClipboard.reviveDates(
      payload.formData
    ) as Record<string, unknown>;
    this.fields = this.formClipboard.toFields(
      this.revivedFormData,
      this.config.data.currentFormData
    );
    this.selection = [...this.fields];
  }

  apply(): void {
    if (!this.revivedFormData) {
      return;
    }
    const formData = this.formClipboard.prune(
      this.revivedFormData,
      this.selection.map((field) => field.path)
    );
    this.ref.close({formData, count: this.selection.length});
  }

  cancel(): void {
    this.ref.close();
  }
}
