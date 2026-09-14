import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NecDefragLoaderComponent } from './nec-defrag-loader.component';

describe('NecDefragLoaderComponent', () => {
  let fixture: ComponentFixture<NecDefragLoaderComponent>;
  let component: NecDefragLoaderComponent;

  beforeEach(async () => {
    // jsdom non implementa il contesto 2D: il componente deve reggerlo senza
    // rumore, quindi lo stub è esplicito.
    HTMLCanvasElement.prototype.getContext = jest.fn(
      () => null
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    await TestBed.configureTestingModule({
      imports: [NecDefragLoaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NecDefragLoaderComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
    jest.restoreAllMocks();
  });

  function text(selector: string): string {
    const el: HTMLElement | null =
      fixture.nativeElement.querySelector(selector);
    return el ? (el.textContent ?? '').trim() : '';
  }

  it('si crea senza contesto canvas e mostra il titolo', () => {
    fixture.componentRef.setInput('title', 'Defragmenting Drive C');
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(text('.nec-titlebar-text')).toBe('Defragmenting Drive C');
    expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();
  });

  it('dimensiona il canvas sulla geometria nativa moltiplicata per scale', () => {
    fixture.componentRef.setInput('cols', 20);
    fixture.componentRef.setInput('rows', 5);
    fixture.detectChanges();

    // caselle 7x9 come le bitmap originali, ingrandite 2x di default
    const canvas: HTMLCanvasElement =
      fixture.nativeElement.querySelector('canvas');
    expect(component.nativeWidth).toBe(140);
    expect(component.nativeHeight).toBe(45);
    expect(canvas.style.width).toBe('280px');
    expect(canvas.style.height).toBe('90px');
  });

  it('in modalità determinata pubblica la percentuale reale', () => {
    fixture.componentRef.setInput('progress', 42);
    fixture.detectChanges();

    expect(component.isDeterminate).toBe(true);
    expect(component.percent).toBe(42);
    expect(text('.nec-progress-label')).toBe('42% Complete');
    expect(fixture.nativeElement.getAttribute('aria-valuenow')).toBe('42');
    expect(fixture.nativeElement.getAttribute('role')).toBe('progressbar');
  });

  it('accende i blocchi della barra in proporzione', () => {
    fixture.componentRef.setInput('progress', 50);
    fixture.detectChanges();

    const blocks = fixture.nativeElement.querySelectorAll(
      '.nec-progress-block'
    );
    const on = fixture.nativeElement.querySelectorAll(
      '.nec-progress-block--on'
    );
    expect(blocks.length).toBeGreaterThan(0);
    expect(on.length).toBe(Math.round(blocks.length / 2));
  });

  it('in modalità indeterminata non espone un valore', () => {
    fixture.detectChanges();

    expect(component.isDeterminate).toBe(false);
    expect(fixture.nativeElement.getAttribute('aria-valuenow')).toBeNull();
    expect(fixture.nativeElement.getAttribute('aria-busy')).toBe('true');
  });

  it('non avvia il loop quando running è false', () => {
    fixture.componentRef.setInput('running', false);
    fixture.detectChanges();

    expect(component.isAnimating).toBe(false);
  });

  it('riparte quando running torna true', () => {
    fixture.componentRef.setInput('running', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('running', true);
    fixture.detectChanges();

    expect(component.isAnimating).toBe(true);
  });

  it('avvia e ferma il loop di animazione con il ciclo di vita', () => {
    jest.spyOn(window, 'requestAnimationFrame').mockReturnValue(1234);
    const caf = jest.spyOn(window, 'cancelAnimationFrame');

    fixture.detectChanges();
    expect(component.isAnimating).toBe(true);

    fixture.destroy();
    expect(caf).toHaveBeenCalledWith(1234);
    expect(component.isAnimating).toBe(false);
  });

  it('non anima se il target determinato è già raggiunto', () => {
    fixture.componentRef.setInput('progress', 0);
    fixture.detectChanges();

    expect(component.isAnimating).toBe(false);
  });

  it('mostra la legenda solo su richiesta', () => {
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.nec-legend-entry').length
    ).toBe(0);

    fixture.componentRef.setInput('showLegend', true);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('.nec-legend-entry').length
    ).toBe(component.legend.length);
  });

  it('applica la palette parziale senza perdere gli altri colori', () => {
    fixture.componentRef.setInput('palette', { unoptimizedBegin: '#123456' });
    fixture.detectChanges();

    expect(component.colors.unoptimizedBegin).toBe('#123456');
    expect(component.colors.reading).toBe('#00ff00');
    expect(component.colors.optimized).toEqual(['#0000ff', '#00ffff']);
  });

  it('usa le etichette verbatim del dialogo originale', () => {
    fixture.componentRef.setInput('showLegend', true);
    fixture.detectChanges();

    const labels: string[] = Array.from(
      fixture.nativeElement.querySelectorAll('.nec-legend-entry')
    ).map((el) => ((el as HTMLElement).textContent ?? '').trim());

    expect(labels[0]).toBe('Unoptimized data that:');
    expect(labels).toContain('Belongs at beginning of drive');
    expect(labels).toContain('Optimized (defragmented) data');
    expect(labels).toContain('Bad (damaged) area of the disk');
    expect(text('.nec-legend-note')).toBe(
      'Each box represents one disk cluster.'
    );
  });

  it('nasconde chrome e barra quando disattivati', () => {
    fixture.componentRef.setInput('showChrome', false);
    fixture.componentRef.setInput('showProgress', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.nec-titlebar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.nec-progress')).toBeNull();
  });
});
