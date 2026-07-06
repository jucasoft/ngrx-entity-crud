import {Injectable} from '@angular/core';
import {
  NEC_FORM_CLIPBOARD_VERSION,
  NecFormClipboardField,
  NecFormClipboardParseResult,
  NecFormClipboardPayload,
} from './models';

// formato prodotto da JSON.stringify su un Date: solo questo torna Date
const ISO_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Serializzazione, validazione e accesso clipboard per il copia/incolla dei
 * criteri di un form di ricerca. Il form value viene appiattito in "foglie"
 * (condizioni `{fieldValue, operator, enabled}` o valori semplici) così da
 * permettere export/import selettivo campo per campo.
 *
 * Nessuna dipendenza da store o da altri moduli dell'app consumer; la copia
 * negli appunti è implementata internamente (niente peer su `@angular/cdk`).
 */
@Injectable({providedIn: 'root'})
export class NecFormClipboardService {
  buildPayload(
    componentName: string,
    formData: Record<string, unknown>,
    selected: NecFormClipboardField[]
  ): NecFormClipboardPayload {
    return {
      v: NEC_FORM_CLIPBOARD_VERSION,
      componentName,
      formData: this.prune(
        formData,
        selected.map((field) => field.path)
      ),
    };
  }

  serialize(payload: NecFormClipboardPayload): string {
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Copia sincrona con la tecnica textarea + execCommand (la stessa del CDK
   * Clipboard, ma senza la dipendenza); `navigator.clipboard.writeText` come
   * fallback best-effort asincrono.
   */
  copy(text: string): boolean {
    if (typeof document === 'undefined') {
      return false;
    }
    const textarea = document.createElement('textarea');
    textarea.style.position = 'fixed';
    textarea.style.top = '-999px';
    textarea.style.opacity = '0';
    textarea.setAttribute('readonly', '');
    textarea.value = text;
    document.body.appendChild(textarea);
    let ok = false;
    try {
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      ok = document.execCommand('copy');
    } catch (_e) {
      ok = false;
    } finally {
      document.body.removeChild(textarea);
    }
    if (!ok && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => undefined);
      ok = true;
    }
    return ok;
  }

  /**
   * Lettura "attiva" degli appunti: disponibile solo in contesto sicuro
   * (https/localhost) e con permesso del browser; se negata o non supportata
   * ritorna null e l'utente incolla a mano con Ctrl+V (l'evento paste non
   * richiede permessi).
   */
  async tryReadClipboard(): Promise<string | null> {
    try {
      return await navigator.clipboard.readText();
    } catch (_e) {
      return null;
    }
  }

  parse(text: string): NecFormClipboardParseResult {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch (_e) {
      return {error: 'Invalid JSON'};
    }
    if (
      !this.isRecord(raw) ||
      typeof raw['componentName'] !== 'string' ||
      !this.isRecord(raw['formData'])
    ) {
      return {
        error: 'Unrecognized payload: expected {v, componentName, formData}',
      };
    }
    return {payload: raw as unknown as NecFormClipboardPayload};
  }

  /**
   * Appiattisce il form value in righe di riepilogo: una per foglia
   * (condizione o valore semplice). I gruppi vuoti non producono righe.
   */
  toFields(
    formData: Record<string, unknown>,
    currentFormData?: Record<string, unknown>
  ): NecFormClipboardField[] {
    const fields: NecFormClipboardField[] = [];
    this.walk(formData, [], fields);
    if (currentFormData) {
      fields.forEach((field) => {
        field.currentSummary = this.summarize(
          this.valueAt(currentFormData, field.path)
        );
      });
    }
    return fields;
  }

  /**
   * Ricostruisce un form value parziale con le sole foglie selezionate,
   * pronto per `form.patchValue(...)`.
   */
  prune(
    source: Record<string, unknown>,
    paths: string[]
  ): Record<string, unknown> {
    return paths.reduce((result: Record<string, unknown>, path: string) => {
      const keys = path.split('.');
      let src: unknown = source;
      let dst = result;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (!this.isRecord(src) || !(key in src)) {
          return result;
        }
        src = src[key];
        if (i === keys.length - 1) {
          dst[key] = src;
        } else {
          if (!this.isRecord(dst[key])) {
            dst[key] = {};
          }
          dst = dst[key] as Record<string, unknown>;
        }
      }
      return result;
    }, {});
  }

  /**
   * Riconverte in Date i `fieldValue` delle condizioni di tipo
   * date/date_time: JSON.stringify li appiattisce in stringhe ISO, ma i
   * date-picker (es. p-calendar) si aspettano un Date.
   */
  reviveDates(node: unknown): unknown {
    if (this.isCondition(node)) {
      const type = node['type'];
      const fieldValue = node['fieldValue'];
      if (
        (type === 'date' || type === 'date_time') &&
        typeof fieldValue === 'string' &&
        ISO_DATE_TIME.test(fieldValue)
      ) {
        return {...node, fieldValue: new Date(fieldValue)};
      }
      return node;
    }
    if (!this.isRecord(node)) {
      return node;
    }
    return Object.keys(node).reduce(
      (prev: Record<string, unknown>, key: string) => {
        prev[key] = this.reviveDates(node[key]);
        return prev;
      },
      {}
    );
  }

  private walk(
    node: unknown,
    path: string[],
    out: NecFormClipboardField[]
  ): void {
    if (path.length > 0 && this.isLeaf(node)) {
      out.push({
        path: path.join('.'),
        label: path[path.length - 1],
        value: node,
        summary: this.summarize(node),
      });
      return;
    }
    if (!this.isRecord(node)) {
      return;
    }
    Object.keys(node).forEach((key) =>
      this.walk(node[key], [...path, key], out)
    );
  }

  private isLeaf(node: unknown): boolean {
    return !this.isRecord(node) || this.isCondition(node);
  }

  private isCondition(node: unknown): node is Record<string, unknown> {
    return (
      this.isRecord(node) &&
      'fieldValue' in node &&
      'operator' in node &&
      'enabled' in node
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return (
      typeof value === 'object' && value !== null && !Array.isArray(value)
    );
  }

  private summarize(value: unknown): string {
    if (this.isCondition(value)) {
      const text = this.formatFieldValue(value['fieldValue']);
      if (text === '') {
        return '—';
      }
      const operator = value['operator'] || '=';
      return value['enabled'] === false
        ? `${operator} ${text} (off)`
        : `${operator} ${text}`;
    }
    const text = this.formatFieldValue(value);
    return text === '' ? '—' : text;
  }

  private formatFieldValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => this.formatFieldValue(item))
        .filter((text) => text !== '')
        .join(', ');
    }
    if (this.isRecord(value)) {
      return 'key' in value ? String(value['key']) : JSON.stringify(value);
    }
    return String(value);
  }

  private valueAt(source: Record<string, unknown>, path: string): unknown {
    return path
      .split('.')
      .reduce(
        (prev: unknown, key: string) =>
          this.isRecord(prev) ? prev[key] : undefined,
        source
      );
  }
}
