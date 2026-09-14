import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  NecDefragBand,
  NecDefragCluster,
  NecDefragField,
  necCreateDefragField,
  necDefragAdvanceTo,
  necDefragProgress,
  necDefragStep,
} from './defrag-engine';

/**
 * Colori della mappa cluster. I valori di default sono quelli letti dalle
 * bitmap del Disk Defragmenter di Windows 98: palette VGA a 16 colori, senza
 * tinte intermedie. I mezzi toni erano scacchiere a 1 pixel, per questo due
 * voci sono coppie di colori e non un colore solo.
 */
export interface NecDefragPalette {
  /** Cornice di ogni casella: è lei a disegnare il reticolo. */
  border: string;
  /** Sfondo dell'area, oltre la fine del disco. */
  background: string;
  /** Spazio libero. */
  free: string;
  /** Dati non ottimizzati che appartengono all'inizio del volume. */
  unoptimizedBegin: string;
  /** Dati non ottimizzati che appartengono alla metà del volume. */
  unoptimizedMiddle: string;
  /** Dati non ottimizzati che appartengono alla fine: scacchiera a 1px. */
  unoptimizedEnd: [string, string];
  /** Dati ottimizzati (deframmentati): scacchiera a 1px. */
  optimized: [string, string];
  /** Cluster in lettura in questo istante. */
  reading: string;
  /** Cluster in scrittura in questo istante. */
  writing: string;
  /** Marcatore dei cluster non spostabili e delle aree danneggiate. */
  marker: string;
}

/**
 * Palette originale del Disk Defragmenter di Windows 98.
 *
 * Nota controintuitiva ma corretta: la mappa "prima" è **ciano/teal**, il blu
 * (azzurro dithered) è il colore di ciò che è **già ottimizzato**. Verde è la
 * lettura, rosso la scrittura.
 */
export const NEC_DEFRAG_PALETTE_WIN98: NecDefragPalette = {
  border: '#000000',
  background: '#ffffff',
  free: '#ffffff',
  unoptimizedBegin: '#00ffff',
  unoptimizedMiddle: '#008080',
  unoptimizedEnd: ['#008080', '#000000'],
  optimized: ['#0000ff', '#00ffff'],
  reading: '#00ff00',
  writing: '#ff0000',
  marker: '#ff0000',
};

/** Voce della legenda, come nel dialogo "Defrag Legend" originale. */
export interface NecDefragLegendEntry {
  /** Etichetta, verbatim dalle risorse dell'eseguibile. */
  label: string;
  /** `true` per l'intestazione di gruppo, che non ha casella. */
  heading: boolean;
  /** Casella d'esempio come data URI; `null` dove il canvas non è disponibile. */
  image: string | null;
  /** Colore di ripiego quando l'immagine non c'è. */
  color: string;
}

/** Aspetto delle caselle nella legenda, in ordine di dialogo. */
interface LegendSample {
  label: string;
  heading: boolean;
  state: NecDefragCluster;
  band: NecDefragBand;
  head: HeadMark;
}

type HeadMark = 'read' | 'write' | null;

/* eslint-disable quotes -- etichette verbatim dalle risorse originali, apostrofo dritto incluso */
const LEGEND_SAMPLES: LegendSample[] = [
  {
    label: 'Unoptimized data that:',
    heading: true,
    state: NecDefragCluster.Free,
    band: NecDefragBand.Begin,
    head: null,
  },
  {
    label: 'Belongs at beginning of drive',
    heading: false,
    state: NecDefragCluster.Used,
    band: NecDefragBand.Begin,
    head: null,
  },
  {
    label: 'Belongs in middle of drive',
    heading: false,
    state: NecDefragCluster.Used,
    band: NecDefragBand.Middle,
    head: null,
  },
  {
    label: 'Belongs at end of drive',
    heading: false,
    state: NecDefragCluster.Used,
    band: NecDefragBand.End,
    head: null,
  },
  {
    label: 'Optimized (defragmented) data',
    heading: false,
    state: NecDefragCluster.Optimized,
    band: NecDefragBand.Begin,
    head: null,
  },
  {
    label: 'Free space',
    heading: false,
    state: NecDefragCluster.Free,
    band: NecDefragBand.Begin,
    head: null,
  },
  {
    label: 'Data that will not be moved',
    heading: false,
    state: NecDefragCluster.Unmovable,
    band: NecDefragBand.Begin,
    head: null,
  },
  {
    label: 'Bad (damaged) area of the disk',
    heading: false,
    state: NecDefragCluster.Bad,
    band: NecDefragBand.Begin,
    head: null,
  },
  {
    label: "Data that's currently being read",
    heading: false,
    state: NecDefragCluster.Used,
    band: NecDefragBand.Begin,
    head: 'read',
  },
  {
    label: "Data that's currently being written",
    heading: false,
    state: NecDefragCluster.Used,
    band: NecDefragBand.Begin,
    head: 'write',
  },
];

/** Piè di pagina del dialogo originale. */
const LEGEND_NOTE = 'Each box represents one disk cluster.';
/* eslint-enable quotes */

/**
 * `<nec-defrag-loader>` — indicatore di operazione in corso che rifà il
 * "Disk Defragmenter" di Windows 98: mappa di cluster che si compatta verso
 * l'inizio del disco, barra di avanzamento a blocchi e chrome di sistema.
 *
 * Due modalità:
 * - **indeterminata** (default, `progress` non valorizzato): la passata gira in
 *   loop finché `running` resta `true`. Da usare quando non si sa quanto durerà
 *   l'operazione.
 * - **determinata** (`[progress]="0..100"`): la percentuale reale pilota il
 *   consolidamento, così la mappa è una lettura fedele dell'avanzamento.
 *
 * ```html
 * <nec-defrag-loader
 *   *ngIf="loading$ | async"
 *   [title]="'Defragmenting Drive C'"
 *   [status]="'Reading drive information...'"
 *   [progress]="uploaded$ | async"
 *   (passCompleted)="onPass()"
 * ></nec-defrag-loader>
 * ```
 *
 * Il disegno è pixel art vera: le caselle sono ricostruite in un buffer
 * `ImageData` alla risoluzione nativa delle bitmap originali (7x9 px, cornice
 * nera 1px e nucleo 5x7, con le scacchiere a 1 pixel al posto dei mezzi toni) e
 * poi ingrandite con lo smoothing disattivato, così restano nette a qualsiasi
 * `scale` e densità di schermo. Il loop gira fuori dalla zona Angular (nessun
 * change detection per frame) e si ferma in `ngOnDestroy`; con
 * `prefers-reduced-motion` il disco avanza al rallentatore e la testina non
 * lampeggia. Nessuna dipendenza da PrimeNG: il look retro è volutamente
 * estraneo al tema dell'app.
 *
 * Vincoli di compatibilità del pacchetto (Angular 16 → 19): `@Input`/`@Output`
 * classici, `*ngIf`/`*ngFor` e niente `@if`/`@for`, nessuna API introdotta dopo
 * la 16.2.
 */
@Component({
  selector: 'nec-defrag-loader',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'progressbar',
    '[attr.aria-label]': 'title',
    '[attr.aria-valuemin]': 'isDeterminate ? 0 : null',
    '[attr.aria-valuemax]': 'isDeterminate ? 100 : null',
    '[attr.aria-valuenow]': 'isDeterminate ? percent : null',
    '[attr.aria-busy]': 'running',
    '[class.nec-defrag-overlay]': 'overlay',
  },
  styles: [
    `
      :host {
        display: inline-block;
        font-family: 'MS Sans Serif', 'Microsoft Sans Serif', sans-serif;
        font-size: 11px;
        color: #000000;
        -webkit-font-smoothing: none;
      }
      :host(.nec-defrag-overlay) {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.45);
        z-index: 1000;
      }
      .nec-window {
        display: inline-block;
        background: #c0c0c0;
        padding: 3px;
      }
      .nec-window--chrome {
        border: 1px solid;
        border-color: #dfdfdf #000000 #000000 #dfdfdf;
        box-shadow: inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080;
      }
      .nec-titlebar {
        display: flex;
        align-items: center;
        gap: 4px;
        height: 18px;
        padding: 0 2px 0 3px;
        margin-bottom: 3px;
        background: linear-gradient(90deg, #000080 0%, #1084d0 100%);
        color: #ffffff;
        font-weight: bold;
        user-select: none;
      }
      .nec-titlebar-icon {
        width: 12px;
        height: 12px;
        flex: none;
        background: #c0c0c0;
        box-shadow: inset -1px -1px 0 #808080, inset 1px 1px 0 #ffffff;
      }
      .nec-titlebar-text {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      .nec-titlebar-buttons {
        display: flex;
        gap: 2px;
        flex: none;
      }
      .nec-titlebar-button {
        width: 16px;
        height: 14px;
        background: #c0c0c0;
        box-shadow: inset -1px -1px 0 #000000, inset 1px 1px 0 #ffffff,
          inset -2px -2px 0 #808080, inset 2px 2px 0 #dfdfdf;
      }
      .nec-body {
        padding: 6px;
      }
      .nec-canvas-frame {
        display: inline-block;
        padding: 2px;
        background: #ffffff;
        box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff,
          inset 2px 2px 0 #000000, inset -2px -2px 0 #dfdfdf;
      }
      .nec-canvas {
        display: block;
        image-rendering: pixelated;
      }
      .nec-status {
        margin-top: 8px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .nec-progress {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 6px;
      }
      .nec-progress-track {
        display: flex;
        align-items: center;
        gap: 2px;
        flex: 1;
        height: 20px;
        padding: 2px;
        background: #c0c0c0;
        box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff,
          inset 2px 2px 0 #000000, inset -2px -2px 0 #dfdfdf;
      }
      .nec-progress-block {
        width: 8px;
        align-self: stretch;
        flex: none;
        background: transparent;
      }
      .nec-progress-block--on {
        background: #000080;
      }
      .nec-progress-label {
        flex: none;
        min-width: 78px;
        text-align: right;
      }
      .nec-legend {
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px solid #808080;
        box-shadow: inset 0 1px 0 #ffffff;
      }
      .nec-legend-entry {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 10px;
      }
      .nec-legend-entry--heading {
        margin-left: 0;
      }
      .nec-legend-swatch {
        width: 14px;
        height: 18px;
        flex: none;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        image-rendering: pixelated;
      }
      .nec-legend-note {
        display: block;
        margin-top: 6px;
      }
    `,
  ],
  template: `
    <div class="nec-window" [class.nec-window--chrome]="showChrome">
      <div class="nec-titlebar" *ngIf="showChrome">
        <span class="nec-titlebar-icon" aria-hidden="true"></span>
        <span class="nec-titlebar-text">{{ title }}</span>
        <span class="nec-titlebar-buttons" aria-hidden="true">
          <span class="nec-titlebar-button"></span>
          <span class="nec-titlebar-button"></span>
          <span class="nec-titlebar-button"></span>
        </span>
      </div>
      <div class="nec-body">
        <div class="nec-canvas-frame">
          <canvas #canvas class="nec-canvas" aria-hidden="true"></canvas>
        </div>
        <div class="nec-status" *ngIf="status">{{ status }}</div>
        <div class="nec-progress" *ngIf="showProgress">
          <span class="nec-progress-track">
            <span
              class="nec-progress-block"
              *ngFor="let block of progressBlocks; let i = index"
              [class.nec-progress-block--on]="i < filledBlocks"
            ></span>
          </span>
          <span class="nec-progress-label">{{ percent }}% Complete</span>
        </div>
        <div class="nec-legend" *ngIf="showLegend">
          <span
            class="nec-legend-entry"
            *ngFor="let entry of legend"
            [class.nec-legend-entry--heading]="entry.heading"
          >
            <span
              class="nec-legend-swatch"
              *ngIf="!entry.heading"
              [style.background-color]="entry.color"
              [style.background-image]="entry.image ? swatchUrl(entry) : null"
            ></span>
            <span>{{ entry.label }}</span>
          </span>
          <span class="nec-legend-note">{{ legendNote }}</span>
        </div>
      </div>
    </div>
  `,
})
export class NecDefragLoaderComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  /** Testo della barra del titolo. */
  @Input() title = 'Defragmenting Drive C';

  /** Riga di stato sotto la mappa; nascosta se vuota. */
  @Input() status = '';

  /**
   * Avanzamento reale 0..100. Se valorizzato il componente è determinato: la
   * mappa si consolida fino alla percentuale indicata e lì si ferma.
   * Lasciare `null`/`undefined` per l'indeterminato in loop.
   */
  @Input() progress: number | null = null;

  /** Ferma l'animazione senza smontare il componente. */
  @Input() running = true;

  /** Cluster per riga. */
  @Input() cols = 48;

  /** Righe di cluster. */
  @Input() rows = 12;

  /** Larghezza della casella in px nativi, cornice inclusa. */
  @Input() cellWidth = 7;

  /** Altezza della casella in px nativi, cornice inclusa. */
  @Input() cellHeight = 9;

  /** Ingrandimento intero della mappa: i pixel restano netti. */
  @Input() scale = 2;

  /** Quota di disco occupata all'inizio della passata, 0..1. */
  @Input() density = 0.62;

  /** Seme del disco: stesso seme, stessa frammentazione. */
  @Input() seed = 1;

  /** Cluster consolidati al secondo. */
  @Input() clustersPerSecond = 30;

  /** Chrome Windows 98 (bordi 3D e barra del titolo). */
  @Input() showChrome = true;

  /** Barra di avanzamento a blocchi e "xx% Complete". */
  @Input() showProgress = true;

  /** Legenda, come il dialogo "Defrag Legend" originale. */
  @Input() showLegend = false;

  /** In indeterminato, rigenera il disco e riparte a fine passata. */
  @Input() loop = true;

  /** Copre la pagina con uno sfondo scurito, centrando la finestra. */
  @Input() overlay = false;

  /** Colori della mappa; i valori mancanti restano quelli di Windows 98. */
  @Input() palette: Partial<NecDefragPalette> | null = null;

  /** Emesso a ogni passata completata, con il numero progressivo di passata. */
  @Output() passCompleted = new EventEmitter<number>();

  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  /** Percentuale intera mostrata a video. */
  percent = 0;

  /** Blocchi accesi nella barra di avanzamento. */
  filledBlocks = 0;

  /** Slot della barra di avanzamento, per `*ngFor`. */
  progressBlocks: number[] = [];

  /** Voci della legenda, ricalcolate quando cambiano palette o geometria. */
  legend: NecDefragLegendEntry[] = [];

  /** Piè di pagina della legenda. */
  readonly legendNote = LEGEND_NOTE;

  /** Palette effettiva: default di Windows 98 più gli override di `[palette]`. */
  colors: NecDefragPalette = NEC_DEFRAG_PALETTE_WIN98;

  private field: NecDefragField = necCreateDefragField();
  private ctx: CanvasRenderingContext2D | null = null;
  private rafId: number | null = null;
  private lastTickAt = 0;
  private pauseUntil = 0;
  private passes = 0;
  private viewReady = false;
  private reducedMotion = false;

  /** Buffer alla risoluzione nativa, poi ingrandito senza interpolazione. */
  private buffer: HTMLCanvasElement | null = null;
  private bufferCtx: CanvasRenderingContext2D | null = null;
  private image: ImageData | null = null;
  private pixels: Uint32Array | null = null;

  /** Colori impacchettati in RGBA32, nell'ordine del buffer. */
  private packed = packPalette(NEC_DEFRAG_PALETTE_WIN98);

  private static readonly PROGRESS_BLOCKS = 34;
  /** Pausa a fine passata prima di rigenerare il disco, in ms. */
  private static readonly PASS_PAUSE_MS = 900;

  constructor() {
    this.progressBlocks = new Array(
      NecDefragLoaderComponent.PROGRESS_BLOCKS
    ).fill(0);
    this.reducedMotion = matchesReducedMotion();
    this.legend = buildLegend(this.colors, null);
  }

  /** `true` quando l'avanzamento è pilotato da `[progress]`. */
  get isDeterminate(): boolean {
    return this.progress !== null && this.progress !== undefined;
  }

  /** `true` finché il loop di disegno è schedulato. */
  get isAnimating(): boolean {
    return this.rafId !== null;
  }

  /** Larghezza della mappa in px nativi. */
  get nativeWidth(): number {
    return this.field.cols * Math.max(3, Math.floor(this.cellWidth));
  }

  /** Altezza della mappa in px nativi. */
  get nativeHeight(): number {
    return this.field.rows * Math.max(3, Math.floor(this.cellHeight));
  }

  /** URL della casella d'esempio, per il binding di background-image. */
  swatchUrl(entry: NecDefragLegendEntry): string | null {
    return entry.image ? `url(${entry.image})` : null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['palette']) {
      this.colors = { ...NEC_DEFRAG_PALETTE_WIN98, ...(this.palette ?? {}) };
      this.packed = packPalette(this.colors);
    }

    const geometryChanged =
      changes['cols'] ||
      changes['rows'] ||
      changes['cellWidth'] ||
      changes['cellHeight'] ||
      changes['scale'];

    if (
      changes['cols'] ||
      changes['rows'] ||
      changes['density'] ||
      changes['seed']
    ) {
      this.resetField();
    }
    if (geometryChanged) {
      this.syncCanvasSize();
    }
    if (changes['palette'] || geometryChanged) {
      this.updateLegend();
    }

    if (this.isDeterminate && (changes['progress'] || geometryChanged)) {
      // Il testo mostra subito la percentuale vera; la mappa la insegue un
      // cluster per tick, a meno che l'animazione sia disattivata.
      this.publishProgress(this.progress as number);
      if (!this.running) {
        necDefragAdvanceTo(this.field, this.progress as number);
      }
    }

    this.render();

    if (changes['running'] || changes['progress'] || geometryChanged) {
      this.updateLoop();
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      try {
        this.ctx = canvas.getContext('2d');
      } catch {
        this.ctx = null; // jsdom e ambienti senza canvas
      }
    }
    this.syncCanvasSize();
    this.updateLegend();
    this.render();
    this.updateLoop();
  }

  ngOnDestroy(): void {
    this.stopLoop();
  }

  /** Rigenera il disco e riparte da zero. */
  restart(): void {
    this.passes = 0;
    this.resetField();
    if (this.isDeterminate) {
      necDefragAdvanceTo(this.field, this.progress as number);
      this.publishProgress(this.progress as number);
    } else {
      this.publishProgress(0);
    }
    this.render();
    this.updateLoop();
  }

  private resetField(): void {
    this.field = necCreateDefragField({
      cols: this.cols,
      rows: this.rows,
      density: this.density,
      seed: this.seed + this.passes,
    });
  }

  private syncCanvasSize(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return;
    }
    const scale = Math.max(1, Math.floor(this.scale));
    const cssWidth = this.nativeWidth * scale;
    const cssHeight = this.nativeHeight * scale;
    const dpr =
      typeof window !== 'undefined' && window.devicePixelRatio
        ? window.devicePixelRatio
        : 1;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.round(cssWidth * dpr);
    canvas.height = Math.round(cssHeight * dpr);
    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = false;
    }
  }

  private updateLoop(): void {
    const wants = this.viewReady && this.running && !this.isPaused();
    if (wants) {
      this.startLoop();
    } else {
      this.stopLoop();
    }
  }

  /** In determinato non c'è nulla da animare finché il target non cambia. */
  private isPaused(): boolean {
    return (
      this.isDeterminate &&
      necDefragProgress(this.field) >= (this.progress as number)
    );
  }

  private startLoop(): void {
    if (this.rafId !== null || typeof requestAnimationFrame === 'undefined') {
      return;
    }
    this.zone.runOutsideAngular(() => {
      this.lastTickAt = 0;
      this.rafId = requestAnimationFrame(this.frame);
    });
  }

  private stopLoop(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }

  private readonly frame = (now: number): void => {
    this.rafId = requestAnimationFrame(this.frame);

    if (this.pauseUntil > now) {
      return;
    }
    // Con `prefers-reduced-motion` il disco avanza al rallentatore e la testina
    // non lampeggia: resta l'informazione, sparisce l'effetto.
    const rate = this.reducedMotion
      ? Math.min(4, this.clustersPerSecond)
      : this.clustersPerSecond;
    const interval = 1000 / Math.max(1, rate);
    if (this.lastTickAt && now - this.lastTickAt < interval) {
      return;
    }
    this.lastTickAt = now;

    if (this.isDeterminate) {
      this.tickDeterminate();
    } else {
      this.tickIndeterminate(now);
    }
    this.render();
  };

  private tickDeterminate(): void {
    const target = this.progress as number;
    if (necDefragProgress(this.field) >= target) {
      this.stopLoop();
      return;
    }
    necDefragStep(this.field);
    this.publishProgress(target);
  }

  private tickIndeterminate(now: number): void {
    if (necDefragStep(this.field)) {
      this.publishProgress(necDefragProgress(this.field));
      return;
    }
    // Passata finita: mostra il 100%, poi rigenera un disco frammentato.
    this.publishProgress(100);
    this.passes++;
    this.zone.run(() => this.passCompleted.emit(this.passes));
    if (!this.loop) {
      this.stopLoop();
      return;
    }
    this.pauseUntil = now + NecDefragLoaderComponent.PASS_PAUSE_MS;
    this.resetField();
  }

  /**
   * Porta a video la percentuale solo quando cambia il valore intero: il resto
   * dei frame non tocca Angular, che gira in OnPush fuori zona.
   */
  private publishProgress(value: number): void {
    const percent = Math.max(0, Math.min(100, Math.round(value)));
    const blocks = Math.round(
      (percent / 100) * NecDefragLoaderComponent.PROGRESS_BLOCKS
    );
    if (percent === this.percent && blocks === this.filledBlocks) {
      return;
    }
    this.percent = percent;
    this.filledBlocks = blocks;
    if (NgZone.isInAngularZone()) {
      this.cdr.markForCheck();
    } else {
      this.zone.run(() => this.cdr.markForCheck());
    }
  }

  /** Ricrea il buffer nativo quando cambia la geometria della mappa. */
  private ensureBuffer(): boolean {
    const width = this.nativeWidth;
    const height = this.nativeHeight;
    if (
      this.buffer &&
      this.buffer.width === width &&
      this.buffer.height === height
    ) {
      return this.pixels !== null;
    }
    if (typeof document === 'undefined') {
      return false;
    }
    const buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = buffer.getContext('2d');
    } catch {
      context = null;
    }
    if (!context || typeof context.createImageData !== 'function') {
      return false;
    }
    this.buffer = buffer;
    this.bufferCtx = context;
    this.image = context.createImageData(width, height);
    this.pixels = new Uint32Array(this.image.data.buffer);
    return true;
  }

  private render(): void {
    const ctx = this.ctx;
    if (!ctx || !this.ensureBuffer()) {
      return;
    }
    const pixels = this.pixels as Uint32Array;
    const field = this.field;
    const cellWidth = Math.max(3, Math.floor(this.cellWidth));
    const cellHeight = Math.max(3, Math.floor(this.cellHeight));
    const width = this.nativeWidth;

    pixels.fill(this.packed.background);

    const showHead = !this.reducedMotion;
    for (let i = 0; i < field.cells.length; i++) {
      const head: HeadMark = !showHead
        ? null
        : i === field.readIndex
        ? 'read'
        : i === field.lastWriteIndex
        ? 'write'
        : null;
      paintCell(
        pixels,
        width,
        (i % field.cols) * cellWidth,
        Math.floor(i / field.cols) * cellHeight,
        cellWidth,
        cellHeight,
        field.cells[i],
        field.bands[i],
        head,
        this.packed
      );
    }

    const bufferCtx = this.bufferCtx as CanvasRenderingContext2D;
    bufferCtx.putImageData(this.image as ImageData, 0, 0);

    const scale = Math.max(1, Math.floor(this.scale));
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.buffer as HTMLCanvasElement,
      0,
      0,
      width * scale,
      this.nativeHeight * scale
    );
  }

  /** Ridisegna le caselle d'esempio della legenda con la palette corrente. */
  private updateLegend(): void {
    this.legend = buildLegend(
      this.colors,
      this.viewReady ? this.renderSwatch : null
    );
    this.cdr.markForCheck();
  }

  /** Disegna una singola casella e la restituisce come data URI. */
  private readonly renderSwatch = (sample: LegendSample): string | null => {
    if (typeof document === 'undefined') {
      return null;
    }
    const cellWidth = Math.max(3, Math.floor(this.cellWidth));
    const cellHeight = Math.max(3, Math.floor(this.cellHeight));
    const canvas = document.createElement('canvas');
    canvas.width = cellWidth;
    canvas.height = cellHeight;
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = canvas.getContext('2d');
    } catch {
      context = null;
    }
    if (!context || typeof context.createImageData !== 'function') {
      return null;
    }
    const image = context.createImageData(cellWidth, cellHeight);
    const pixels = new Uint32Array(image.data.buffer);
    pixels.fill(this.packed.background);
    paintCell(
      pixels,
      cellWidth,
      0,
      0,
      cellWidth,
      cellHeight,
      sample.state,
      sample.band,
      sample.head,
      this.packed
    );
    context.putImageData(image, 0, 0);
    try {
      return canvas.toDataURL();
    } catch {
      return null;
    }
  };
}

/** Colori pronti per la scrittura diretta nel buffer RGBA32. */
interface PackedPalette {
  border: number;
  background: number;
  free: number;
  unoptimizedBegin: number;
  unoptimizedMiddle: number;
  unoptimizedEndA: number;
  unoptimizedEndB: number;
  optimizedA: number;
  optimizedB: number;
  reading: number;
  writing: number;
  marker: number;
}

const IS_LITTLE_ENDIAN = (() => {
  const probe = new ArrayBuffer(4);
  new Uint32Array(probe)[0] = 1;
  return new Uint8Array(probe)[0] === 1;
})();

/** `#rgb`/`#rrggbb` → intero RGBA32 nell'ordine del buffer della piattaforma. */
function packColor(hex: string): number {
  let value = (hex || '').trim().replace('#', '');
  if (value.length === 3) {
    value = value[0] + value[0] + value[1] + value[1] + value[2] + value[2];
  }
  const int = parseInt(value, 16);
  const safe = isNaN(int) ? 0 : int;
  const r = (safe >> 16) & 255;
  const g = (safe >> 8) & 255;
  const b = safe & 255;
  return IS_LITTLE_ENDIAN
    ? ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0
    : ((r << 24) | (g << 16) | (b << 8) | 255) >>> 0;
}

function packPalette(palette: NecDefragPalette): PackedPalette {
  return {
    border: packColor(palette.border),
    background: packColor(palette.background),
    free: packColor(palette.free),
    unoptimizedBegin: packColor(palette.unoptimizedBegin),
    unoptimizedMiddle: packColor(palette.unoptimizedMiddle),
    unoptimizedEndA: packColor(palette.unoptimizedEnd[0]),
    unoptimizedEndB: packColor(palette.unoptimizedEnd[1]),
    optimizedA: packColor(palette.optimized[0]),
    optimizedB: packColor(palette.optimized[1]),
    reading: packColor(palette.reading),
    writing: packColor(palette.writing),
    marker: packColor(palette.marker),
  };
}

/**
 * Disegna una casella nel buffer: cornice nera 1px e nucleo, con la scacchiera
 * a 1 pixel dove l'originale usava il dither e i marcatori rossi dei cluster
 * immobili e danneggiati.
 */
function paintCell(
  pixels: Uint32Array,
  bufferWidth: number,
  x0: number,
  y0: number,
  cellWidth: number,
  cellHeight: number,
  state: number,
  band: number,
  head: HeadMark,
  packed: PackedPalette
): void {
  // Cornice: è lei a creare il reticolo, anche attorno allo spazio libero.
  for (let x = 0; x < cellWidth; x++) {
    pixels[(y0 + 0) * bufferWidth + x0 + x] = packed.border;
    pixels[(y0 + cellHeight - 1) * bufferWidth + x0 + x] = packed.border;
  }
  for (let y = 0; y < cellHeight; y++) {
    pixels[(y0 + y) * bufferWidth + x0] = packed.border;
    pixels[(y0 + y) * bufferWidth + x0 + cellWidth - 1] = packed.border;
  }

  const coreWidth = cellWidth - 2;
  const coreHeight = cellHeight - 2;
  if (coreWidth <= 0 || coreHeight <= 0) {
    return;
  }

  let solid = packed.free;
  let checkerA: number | null = null;
  let checkerB = 0;

  if (head === 'read') {
    solid = packed.reading;
  } else if (head === 'write') {
    solid = packed.writing;
  } else {
    switch (state) {
      case NecDefragCluster.Used:
        if (band === NecDefragBand.Middle) {
          solid = packed.unoptimizedMiddle;
        } else if (band === NecDefragBand.End) {
          checkerA = packed.unoptimizedEndA;
          checkerB = packed.unoptimizedEndB;
        } else {
          solid = packed.unoptimizedBegin;
        }
        break;
      case NecDefragCluster.Optimized:
        checkerA = packed.optimizedA;
        checkerB = packed.optimizedB;
        break;
      default:
        solid = packed.free; // Free, Bad, Unmovable: corpo bianco + marcatore
        break;
    }
  }

  for (let y = 0; y < coreHeight; y++) {
    const row = (y0 + 1 + y) * bufferWidth + x0 + 1;
    for (let x = 0; x < coreWidth; x++) {
      pixels[row + x] =
        checkerA === null ? solid : (x + y) % 2 === 0 ? checkerA : checkerB;
    }
  }

  if (head) {
    return;
  }

  if (state === NecDefragCluster.Unmovable) {
    // Angolo superiore destro intaccato di rosso.
    pixels[(y0 + 1) * bufferWidth + x0 + cellWidth - 2] = packed.marker;
    pixels[(y0 + 1) * bufferWidth + x0 + cellWidth - 3] = packed.marker;
    pixels[(y0 + 2) * bufferWidth + x0 + cellWidth - 2] = packed.marker;
  } else if (state === NecDefragCluster.Bad) {
    // Banda diagonale rossa, dall'alto a sinistra al basso a destra.
    for (let y = 0; y < coreHeight; y++) {
      const x =
        coreHeight === 1
          ? 0
          : Math.round((y * (coreWidth - 1)) / (coreHeight - 1));
      pixels[(y0 + 1 + y) * bufferWidth + x0 + 1 + x] = packed.marker;
    }
  }
}

/** Costruisce le voci della legenda, con le caselle se il canvas è disponibile. */
function buildLegend(
  palette: NecDefragPalette,
  renderSwatch: ((sample: LegendSample) => string | null) | null
): NecDefragLegendEntry[] {
  return LEGEND_SAMPLES.map((sample) => ({
    label: sample.label,
    heading: sample.heading,
    image: sample.heading || !renderSwatch ? null : renderSwatch(sample),
    color: fallbackColor(sample, palette),
  }));
}

/** Colore piatto usato quando non si può disegnare la casella. */
function fallbackColor(
  sample: LegendSample,
  palette: NecDefragPalette
): string {
  if (sample.head === 'read') {
    return palette.reading;
  }
  if (sample.head === 'write') {
    return palette.writing;
  }
  switch (sample.state) {
    case NecDefragCluster.Used:
      return sample.band === NecDefragBand.Middle
        ? palette.unoptimizedMiddle
        : sample.band === NecDefragBand.End
        ? palette.unoptimizedEnd[0]
        : palette.unoptimizedBegin;
    case NecDefragCluster.Optimized:
      return palette.optimized[0];
    case NecDefragCluster.Unmovable:
    case NecDefragCluster.Bad:
      return palette.marker;
    default:
      return palette.free;
  }
}

/** `prefers-reduced-motion`, con guardia per SSR e jsdom. */
function matchesReducedMotion(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
