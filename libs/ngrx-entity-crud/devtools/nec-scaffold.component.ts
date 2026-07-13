import {ChangeDetectionStrategy, Component, computed, Input, OnDestroy, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {CardModule} from 'primeng/card';
import {DividerModule} from 'primeng/divider';
import {InputTextModule} from 'primeng/inputtext';
import {TableModule} from 'primeng/table';
import {TagModule} from 'primeng/tag';

/**
 * Repliche browser-side di `strings.camelize/classify/dasherize` di `@angular-devkit/core`:
 * DEVONO produrre gli stessi risultati, perché lo schematic `view` risolve il file di
 * configurazione con `strings.dasherize(clazz)` e un nome diverso romperebbe il flusso.
 */
export function necCamelize(str: string): string {
  return str
    .replace(/(-|_|\.|\s)+(.)?/g, (_match: string, _sep: string, chr: string | undefined) =>
      chr ? chr.toUpperCase() : ''
    )
    .replace(/^([A-Z])/, (m) => m.toLowerCase());
}

export function necClassify(str: string): string {
  return str
    .split('.')
    .map((part) => {
      const camelized = necCamelize(part);
      return camelized.charAt(0).toUpperCase() + camelized.slice(1);
    })
    .join('.');
}

export function necDasherize(str: string): string {
  return str.replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase().replace(/[ _]/g, '-');
}

/** Tipi ammessi dal campo `type` delle condition di ricerca del conf grm-schematics. */
export type NecScaffoldSearchType = 'string' | 'number' | 'date';

/** Riga della tabella campi del pannello Scaffold. */
export interface NecScaffoldField {
  name: string;
  /** Tipo derivato dal valore nel `dtoObject` (logica `typeOf` dello schematic); '' se manuale. */
  dtoType: string;
  /** Tipo della condition di ricerca generata (modificabile: string → number → date). */
  searchType: NecScaffoldSearchType;
  /** Il campo entra in `keys` (solo campi presenti nel DTO: `selectId` legge il DTO). */
  isKey: boolean;
  /** Il campo entra nelle `conditions` della `conditionMap`. */
  inSearch: boolean;
  /** `dto` = derivato dal JSON incollato; `manual` = aggiunto a mano (solo ricerca). */
  origin: 'dto' | 'manual';
}

/**
 * `<nec-scaffold>` — genera il file di configurazione e i comandi per scaffoldare una nuova
 * sezione "form di ricerca + griglia" nei progetti consumer.
 *
 * Il flusso che assiste è quello degli schematics consumer (fork grm-schematics): si crea
 * `<confDir>/<dasherize(clazz)>.json` (con `dtoObject`, `keys`, `conditionMap`,
 * `formAttributes`) e si lanciano in sequenza gli schematics `store` → (`api`) → `view`.
 * Il nome del file è un CONTRATTO: lo schematic `view` lo risolve da `--clazz`, per questo
 * classify/dasherize qui replicano `@angular-devkit/core`.
 *
 * Il pannello gira nel browser e NON può scrivere su disco: il conf JSON si copia negli
 * appunti o si scarica già col nome giusto, da salvare in `confDir`. I campi si derivano
 * incollando un JSON di esempio del BE (stessa derivazione dei tipi `typeOf` dello schematic)
 * e si integrano a mano con i campi di sola ricerca che non esistono nel DTO (es. `startDate`).
 *
 * Stessi vincoli di compatibilità di `<nec-dashboard>` (vedi doc lì): solo componenti PrimeNG
 * con nome classe identico dalla 16 alla 19, `*ngIf`/`*ngFor` (niente `@if`/`@for`), colori
 * dalle CSS variable del tema. La textarea è un elemento nativo stilato a tema perché
 * `InputTextarea` (v16) è stata rinominata `Textarea` in PrimeNG 19 — stessa strategia del
 * box `.nec-message` al posto di `p-message`.
 */
@Component({
  selector: 'nec-scaffold',
  standalone: true,
  imports: [CommonModule, ButtonModule, CardModule, DividerModule, InputTextModule, TableModule, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      :host {
        display: block;
        font-family: var(--font-family, var(--p-font-family, system-ui, sans-serif));
        font-size: 13px;
        color: var(--text-color, var(--p-text-color, #1f2933));
      }
      .nec-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .nec-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(420px, 100%), 1fr));
        gap: 16px;
        align-items: start;
      }
      .nec-mb {
        margin-bottom: 16px;
      }
      .nec-note {
        color: var(--text-color-secondary, var(--p-text-muted-color, #7b8794));
        font-style: italic;
      }
      .nec-ml {
        margin-left: 6px;
      }
      .nec-message {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid transparent;
        border-radius: 6px;
      }
      .nec-message-info {
        background: var(--blue-50, var(--p-blue-50, #eff6ff));
        border-color: var(--blue-200, var(--p-blue-200, #bfdbfe));
        color: var(--blue-900, var(--p-blue-900, #1e3a8a));
      }
      .nec-message-error {
        background: var(--red-50, var(--p-red-50, #fef2f2));
        border-color: var(--red-200, var(--p-red-200, #fecaca));
        color: var(--red-900, var(--p-red-900, #7f1d1d));
      }
      .nec-code {
        margin: 4px 0;
        padding: 6px 8px;
        background: var(--surface-100, var(--p-surface-100, #f5f7fa));
        border: 1px solid var(--surface-border, var(--p-content-border-color, #eceff3));
        border-radius: 4px;
        white-space: pre-wrap;
        word-break: break-word;
        max-height: 420px;
        overflow: auto;
        font-size: 12px;
      }
      /* Textarea nativa a tema: InputTextarea (v16) vs Textarea (v19), vedi doc in testata. */
      .nec-textarea {
        display: block;
        width: 100%;
        box-sizing: border-box;
        padding: 6px 8px;
        background: var(--surface-0, var(--p-surface-0, #ffffff));
        color: inherit;
        border: 1px solid var(--surface-border, var(--p-content-border-color, #ced4da));
        border-radius: 6px;
        font-family: monospace;
        font-size: 12px;
        resize: vertical;
      }
      .nec-input {
        width: 280px;
        max-width: 100%;
      }
      .nec-cmd {
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .nec-checklist {
        margin: 4px 0 0;
        padding-left: 20px;
      }
      .nec-checklist li {
        margin-bottom: 4px;
      }
    `,
  ],
  template: `
    <p-card header="Scaffold — new section">
      <div class="nec-note nec-mb">
        Builds the configuration file and the generate commands for a new "search form + grid"
        section. Nothing is written to disk: copy or download the JSON below, then save it under
        <code>{{ confDir }}/</code>.
      </div>

      <p-divider align="left"><b>1 · Entity</b></p-divider>
      <div class="nec-row nec-mb">
        <label for="nec-scaffold-clazz">Entity name</label>
        <input
          id="nec-scaffold-clazz"
          pInputText
          class="nec-input"
          placeholder="e.g. ProductBrowser"
          [value]="clazz()"
          (input)="setClazz($any($event.target).value)"
        />
        <p-tag severity="info" *ngIf="classified()" [value]="'class ' + classified()"></p-tag>
        <p-tag severity="success" *ngIf="confFileName()" [value]="confPath()"></p-tag>
      </div>

      <p-divider align="left"><b>2 · DTO sample</b></p-divider>
      <div class="nec-note nec-mb">
        Paste a sample JSON object returned by the backend (a single item, not an array): it becomes
        <code>dtoObject</code> and its fields are listed below with their derived type.
      </div>
      <textarea
        class="nec-textarea nec-mb"
        rows="8"
        aria-label="Sample DTO JSON returned by the backend"
        [placeholder]="dtoPlaceholder"
        [value]="dtoText()"
        (input)="setDto($any($event.target).value)"
      ></textarea>
      <div class="nec-message nec-message-error nec-mb" *ngIf="dtoError()" role="alert">
        <i class="pi pi-times-circle"></i>{{ dtoError() }}
      </div>

      <p-divider align="left"><b>3 · Fields</b></p-divider>
      <div class="nec-row nec-mb" *ngIf="fields().length">
        <p-tag severity="info" [value]="fields().length + (fields().length === 1 ? ' field' : ' fields')"></p-tag>
        <p-tag severity="success" *ngIf="keysCount()" [value]="keysCount() + (keysCount() === 1 ? ' key' : ' keys')"></p-tag>
        <p-tag severity="info" *ngIf="searchCount()" [value]="searchCount() + ' in search'"></p-tag>
      </div>
      <p-table *ngIf="fields().length; else noFields" [value]="fields()" styleClass="p-datatable-sm" class="nec-mb">
        <ng-template pTemplate="header">
          <tr>
            <th>field</th>
            <th>dto type</th>
            <th>key</th>
            <th>search</th>
            <th>search type</th>
            <th></th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-f>
          <tr>
            <td>
              {{ f.name }}
              <p-tag styleClass="nec-ml" severity="info" value="manual" *ngIf="f.origin === 'manual'"></p-tag>
            </td>
            <td>{{ f.dtoType || '–' }}</td>
            <td>
              <!-- keys alimenta selectId, che legge il DTO: i campi manuali non sono candidabili. -->
              <button
                type="button"
                pButton
                class="p-button-sm"
                [class.p-button-outlined]="!f.isKey"
                icon="pi pi-key"
                [label]="f.isKey ? 'key' : ''"
                [disabled]="f.origin === 'manual'"
                [title]="f.origin === 'manual' ? 'only DTO fields can be keys (selectId reads the DTO)' : 'toggle key'"
                [attr.aria-label]="'Toggle key for field ' + f.name"
                (click)="toggleKey(f)"
              ></button>
            </td>
            <td>
              <button
                type="button"
                pButton
                class="p-button-sm"
                [class.p-button-outlined]="!f.inSearch"
                icon="pi pi-search"
                [label]="f.inSearch ? 'search' : ''"
                [attr.aria-label]="'Toggle search condition for field ' + f.name"
                (click)="toggleSearch(f)"
              ></button>
            </td>
            <td>
              <button
                type="button"
                pButton
                class="p-button-secondary p-button-outlined p-button-sm"
                [label]="f.searchType"
                [disabled]="!f.inSearch"
                title="cycle string → number → date"
                [attr.aria-label]="'Change search type of field ' + f.name + ' (current: ' + f.searchType + ')'"
                (click)="cycleSearchType(f)"
              ></button>
            </td>
            <td>
              <button
                type="button"
                pButton
                class="p-button-danger p-button-outlined p-button-sm"
                icon="pi pi-times"
                *ngIf="f.origin === 'manual'"
                [attr.aria-label]="'Remove manual field ' + f.name"
                (click)="removeField(f)"
              ></button>
            </td>
          </tr>
        </ng-template>
      </p-table>
      <ng-template #noFields>
        <div class="nec-message nec-message-info nec-mb">
          <i class="pi pi-info-circle"></i>No fields yet: paste a DTO above or add search fields manually.
        </div>
      </ng-template>
      <div class="nec-row nec-mb">
        <label for="nec-scaffold-new-field">Search-only field</label>
        <input
          id="nec-scaffold-new-field"
          pInputText
          class="nec-input"
          placeholder="e.g. startDate (not in the DTO)"
          [value]="newFieldName()"
          (input)="setNewFieldName($any($event.target).value)"
          (keyup.enter)="addManualField()"
        />
        <button type="button" pButton class="p-button-sm" icon="pi pi-plus" label="Add"
                (click)="addManualField()"></button>
        <span class="nec-note" *ngIf="fieldError()" role="alert">{{ fieldError() }}</span>
      </div>
      <div class="nec-row nec-mb">
        <label for="nec-scaffold-section">Search section name</label>
        <input
          id="nec-scaffold-section"
          pInputText
          class="nec-input"
          [placeholder]="sectionKey()"
          [value]="sectionName()"
          (input)="setSectionName($any($event.target).value)"
        />
        <span class="nec-note">key of the conditionMap entry (empty = derived from the entity name)</span>
      </div>

      <p-divider align="left"><b>4 · Output</b></p-divider>
      <div class="nec-grid">
        <div>
          <div class="nec-row nec-mb">
            <button type="button" pButton class="p-button-sm" icon="pi pi-download"
                    label="Download conf" [disabled]="!confFileName()"
                    [title]="confFileName() ? 'download ' + confFileName() : 'enter the entity name first'"
                    (click)="downloadConf()"></button>
            <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
                    icon="pi pi-copy" [label]="copiedWhat() === 'conf' ? 'Copied' : 'Copy conf'"
                    aria-label="Copy the configuration JSON to the clipboard"
                    (click)="copyConf()"></button>
          </div>
          <div class="nec-note nec-mb" *ngIf="confFileName()">
            save as <code>{{ confPath() }}</code> — the view schematic resolves it from
            <code>--clazz {{ classified() }}</code>.
          </div>
          <pre class="nec-code">{{ confText() }}</pre>
        </div>
        <div>
          <ng-container *ngIf="commands().length; else noCommands">
            <div class="nec-row nec-mb" *ngFor="let c of commands(); let i = index">
              <button type="button" pButton class="p-button-secondary p-button-outlined p-button-sm"
                      icon="pi pi-copy" [label]="copiedWhat() === 'cmd-' + i ? 'Copied' : 'Copy'"
                      [attr.aria-label]="'Copy command: ' + c.command"
                      (click)="copyCommand(c.command, i)"></button>
              <code class="nec-cmd">{{ c.command }}</code>
              <span class="nec-note" *ngIf="c.note">{{ c.note }}</span>
            </div>
          </ng-container>
          <ng-template #noCommands>
            <div class="nec-message nec-message-info nec-mb">
              <i class="pi pi-info-circle"></i>Enter the entity name to build the commands.
            </div>
          </ng-template>
          <ng-container *ngIf="checklist.length">
            <p-divider align="left"><b>After generating</b></p-divider>
            <ol class="nec-checklist nec-note">
              <li *ngFor="let item of checklist">{{ item }}</li>
            </ol>
          </ng-container>
        </div>
      </div>
    </p-card>
  `,
})
export class NecScaffoldComponent implements OnDestroy {
  /** Directory (relativa alla root del progetto consumer) dove salvare il conf generato. */
  @Input() confDir = 'grm-schematics/conf';
  /** Schematic dello store CRUD (primo comando); stringa vuota per nasconderlo. */
  @Input() storeSchematic = 'ngrx-entity-crud:store';
  /** Schematic (opzionale) del codice backend, es. `grm-schematics:api`; vuoto = nascosto. */
  @Input() apiSchematic = '';
  /** Schematic della sezione grafica che legge il conf; stringa vuota per nasconderlo. */
  @Input() viewSchematic = 'grm-schematics:view';
  /** Passi manuali post-generazione mostrati sotto i comandi; `[]` per nascondere la lista. */
  @Input() checklist: string[] = [
    'Extend VersionedObject (key/version fields) in the generated DTO if needed.',
    'Register the new entity in update-log.criterias.ts (QueryParamsObjectType).',
    'Add the menu entry for the new section (app-init.service.ts, modulesSource).',
  ];

  /** Placeholder della textarea (proprietà: le graffe nel template confonderebbero l'i18n/lint). */
  readonly dtoPlaceholder = '{"id": "abc", "version": 1, "name": "..."}';

  readonly clazz = signal('');
  readonly dtoText = signal('');
  readonly dtoError = signal<string | null>(null);
  readonly dtoObject = signal<Record<string, unknown> | null>(null);
  readonly fields = signal<NecScaffoldField[]>([]);
  readonly newFieldName = signal('');
  readonly fieldError = signal<string | null>(null);
  /** Override del nome sezione della conditionMap; vuoto = derivato dal nome entità. */
  readonly sectionName = signal('');
  /** Feedback transitorio dei pulsanti di copia ('conf' | 'cmd-<i>'). */
  readonly copiedWhat = signal<string | null>(null);

  /** Nome classe (`ProductBrowser`) derivato come `strings.classify` di @angular-devkit. */
  readonly classified = computed(() => necClassify(this.clazz().trim()));
  /** Nome dasherizzato (`product-browser`): determina il NOME FILE letto dallo schematic view. */
  readonly dasherized = computed(() => necDasherize(this.classified()));
  readonly confFileName = computed(() => (this.dasherized() ? `${this.dasherized()}.json` : ''));
  /** Chiave della sezione in `conditionMap`: override esplicito o nome entità dasherizzato. */
  readonly sectionKey = computed(() => this.sectionName().trim() || this.dasherized() || 'section');
  readonly keysCount = computed(() => this.fields().filter((f) => f.isKey).length);
  readonly searchCount = computed(() => this.fields().filter((f) => f.inSearch).length);
  /** JSON del file di configurazione, pronto per copia/download. */
  readonly confText = computed(() => JSON.stringify(this.buildConf(), null, 2));

  private copiedTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnDestroy(): void {
    if (this.copiedTimer != null) {
      clearTimeout(this.copiedTimer);
      this.copiedTimer = null;
    }
  }

  setClazz(value: string): void {
    this.clazz.set(value);
  }

  setSectionName(value: string): void {
    this.sectionName.set(value);
  }

  setNewFieldName(value: string): void {
    this.newFieldName.set(value);
    this.fieldError.set(null);
  }

  /**
   * Parse "live" del DTO incollato. Su JSON non valido segnala l'errore ma NON tocca i campi
   * già derivati (mentre si digita il testo passa per stati invalidi transitori).
   */
  setDto(text: string): void {
    this.dtoText.set(text);
    const trimmed = text.trim();
    if (!trimmed) {
      this.dtoError.set(null);
      this.dtoObject.set(null);
      this.fields.update((fs) => fs.filter((f) => f.origin === 'manual'));
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(trimmed);
    } catch (e) {
      this.dtoError.set(`Invalid JSON: ${(e as Error).message}`);
      return;
    }
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      this.dtoError.set('The DTO must be a single JSON object (paste one item, not an array).');
      return;
    }
    this.dtoError.set(null);
    const dto = parsed as Record<string, unknown>;
    this.dtoObject.set(dto);
    this.fields.update((existing) => {
      const byName = new Map(existing.map((f) => [f.name, f]));
      const dtoFields = Object.keys(dto).map((name): NecScaffoldField => {
        const dtoType = this.typeOf(dto[name]);
        const prev = byName.get(name);
        if (prev) {
          // Ri-incollare il DTO conserva le scelte fatte; un campo manuale che ora esiste nel
          // DTO viene "promosso" (diventa anche candidabile come key).
          return {...prev, origin: 'dto', dtoType};
        }
        return {
          name,
          dtoType,
          searchType: dtoType === 'number' ? 'number' : 'string',
          isKey: name === 'id',
          inSearch: false,
          origin: 'dto',
        };
      });
      const manual = existing.filter((f) => f.origin === 'manual' && !(f.name in dto));
      return [...dtoFields, ...manual];
    });
  }

  /** Aggiunge un campo di sola ricerca non presente nel DTO (es. `startDate`). */
  addManualField(): void {
    const name = this.newFieldName().trim();
    if (!name) {
      return;
    }
    if (this.fields().some((f) => f.name === name)) {
      this.fieldError.set(`"${name}" is already listed`);
      return;
    }
    this.fieldError.set(null);
    this.fields.update((fs) => [
      ...fs,
      {name, dtoType: '', searchType: 'string', isKey: false, inSearch: true, origin: 'manual'},
    ]);
    this.newFieldName.set('');
  }

  /** Rimuove un campo aggiunto a mano (i campi del DTO si tolgono correggendo il JSON). */
  removeField(field: NecScaffoldField): void {
    this.fields.update((fs) => fs.filter((f) => !(f.name === field.name && f.origin === 'manual')));
  }

  toggleKey(field: NecScaffoldField): void {
    if (field.origin === 'manual') {
      return; // `keys` alimenta selectId, che legge il DTO: un campo fuori dal DTO non può esservi
    }
    this.fields.update((fs) => fs.map((f) => (f.name === field.name ? {...f, isKey: !f.isKey} : f)));
  }

  toggleSearch(field: NecScaffoldField): void {
    this.fields.update((fs) => fs.map((f) => (f.name === field.name ? {...f, inSearch: !f.inSearch} : f)));
  }

  cycleSearchType(field: NecScaffoldField): void {
    const next: Record<NecScaffoldSearchType, NecScaffoldSearchType> = {
      string: 'number',
      number: 'date',
      date: 'string',
    };
    this.fields.update((fs) =>
      fs.map((f) => (f.name === field.name ? {...f, searchType: next[f.searchType]} : f))
    );
  }

  /**
   * Il contenuto del file di configurazione, con la stessa forma consumata da `getOptions()`
   * dello schematic view: `formAttributes` (vuoto: la struttura del form viene dalla
   * `conditionMap`), `dtoObject` così com'è stato incollato, `keys` e una singola sezione
   * di `conditionMap` con le condition abilitabili a runtime (`enabled: false`).
   */
  buildConf(): {
    formAttributes: unknown[];
    dtoObject: Record<string, unknown>;
    keys: string[];
    conditionMap: Record<string, {conditions: unknown[]; conditionsLog: unknown[]}>;
  } {
    const fields = this.fields();
    const conditions = fields
      .filter((f) => f.inSearch)
      .map((f) => ({
        fieldName: f.name,
        fieldValue: null,
        operator: null,
        type: f.searchType,
        enabled: false,
      }));
    return {
      formAttributes: [],
      dtoObject: this.dtoObject() ?? {},
      keys: fields.filter((f) => f.isKey).map((f) => f.name),
      conditionMap: {[this.sectionKey()]: {conditions, conditionsLog: []}},
    };
  }

  /** Percorso completo consigliato del conf (metodo, non computed: dipende dall'@Input). */
  confPath(): string {
    if (!this.confFileName()) {
      return '';
    }
    const dir = this.confDir.replace(/\/+$/, '');
    return dir ? `${dir}/${this.confFileName()}` : this.confFileName();
  }

  /** Sequenza di comandi `ng generate` nell'ordine del flusso: store → api → view. */
  commands(): {command: string; note?: string}[] {
    const clazz = this.classified();
    if (!clazz) {
      return [];
    }
    const out: {command: string; note?: string}[] = [];
    if (this.storeSchematic) {
      out.push({
        command: `ng generate ${this.storeSchematic} --clazz ${clazz}`,
        note: 'select CRUD-PLURAL when prompted',
      });
    }
    if (this.apiSchematic) {
      out.push({command: `ng generate ${this.apiSchematic} --clazz ${clazz}`});
    }
    if (this.viewSchematic) {
      out.push({
        command: `ng generate ${this.viewSchematic} --clazz ${clazz}`,
        note: `reads ${this.confPath()}`,
      });
    }
    return out;
  }

  async copyConf(): Promise<void> {
    await this.copy(this.confText(), 'conf');
  }

  async copyCommand(command: string, index: number): Promise<void> {
    await this.copy(command, `cmd-${index}`);
  }

  /** Scarica il conf come file già col nome atteso dallo schematic (`<dasherize>.json`). */
  downloadConf(): void {
    const name = this.confFileName();
    if (!name) {
      return;
    }
    const blob = new Blob([this.confText()], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /** Stessa derivazione dei tipi di `getOptions()` dello schematic (`typeOf`). */
  private typeOf(item: unknown): string {
    if (item === null) {
      return 'null';
    }
    if (item === undefined) {
      return 'undefined';
    }
    if (Array.isArray(item)) {
      return 'array';
    }
    return typeof item;
  }

  private async copy(text: string, what: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // appunti non disponibili (permessi/contesto non sicuro): nessun feedback
    }
    this.copiedWhat.set(what);
    if (this.copiedTimer != null) {
      clearTimeout(this.copiedTimer);
    }
    this.copiedTimer = setTimeout(() => this.copiedWhat.set(null), 2000);
  }
}
