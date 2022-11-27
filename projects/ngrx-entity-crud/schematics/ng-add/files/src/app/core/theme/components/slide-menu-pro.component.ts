import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { select, Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import {
  debounceTime,
  distinctUntilChanged,
  Observable,
  Subject,
  tap,
  withLatestFrom,
} from 'rxjs';
import { menuItemsDecorator } from '../store/theme-ui-store/operators';
import {
  ThemeUiStoreActions,
  ThemeUiStoreSelectors,
} from '../store/theme-ui-store';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-slide-menu-pro',
  template: `

    <div *ngrxLet="open$; let open"></div>
    <div *ngrxLet="mouseoverSubject$; let mouseoverSubject"></div>

    <div class="flex justify-content-start text-white m-0 header-height header-color">
        <div  class="flex-none flex align-items-center justify-content-center w-5rem">
          <em class="pi pi-heart text-5xl"></em>
        </div>
        <div class="flex-none flex align-items-center justify-content-center text-4xl font-medium">
            Menù
        </div>
    </div>
    <div class="scroller overflow-auto surface-overlay">
      <app-menu-item *ngFor="let item of (items$ | async); index as i"
                     [item]="item"
                     [open]="open"
                     (onSelectChange)="onSelectChange($event)"
                     [index]="i">
      </app-menu-item>
    </div>

  `,
  styles: [
    `
    :host {
      display: block;
      top: 0;
      left: 0;
      width: var(--menu-close-width);
      height: 100vh;
      margin-left: 0;
      position: fixed;
      border-right: solid 1px var(--menu-border-right);
      background-color: var(--sidebar-bg-color);
      -moz-transition: var(--menu-transition);
      -o-transition: var(--menu-transition);
      -webkit-transition: var(--menu-transition);
      transition: var(--menu-transition);
    }

    .scroller {
      height: calc(100vh - (var(--topbar-height) + var(--footer-height)));
    }

    .header-height {
      height: var(--topbar-height);
    }

    .header-color {
      background-color: var(--topbar-bg-color);
    }

    :host(.menu-opened) {
      width: var(--menu-width);
    }

    /* width */
    ::-webkit-scrollbar {
      width: 0.2rem;
    }

    /* Track */
    ::-webkit-scrollbar-track {
      background: #b6b6b6;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: #888;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
      background: #555;
    }

  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlideMenuProComponent implements OnInit, OnDestroy {
  constructor(
    private readonly store$: Store,
    private readonly el: ElementRef
  ) {}
  product = { price: 1 };
  open$: Observable<boolean>;
  items$: Observable<MenuItem[]>;
  mouseoverSubject$: Subject<boolean> = new Subject<boolean>();

  @HostBinding('class.menu-opened')
  open = false;

  ngOnDestroy(): void {}

  // todo: completare profilazione dei pulsanti.
  ngOnInit(): void {
    this.open$ = this.store$
      .select(ThemeUiStoreSelectors.selectMouseoverOrOpen)
      .pipe(tap((value) => (this.open = value)));

    this.items$ = this.store$.pipe(
      select(ThemeUiStoreSelectors.selectItems),
      menuItemsDecorator(this.store$)
    );

    this.mouseoverSubject$
      .pipe(
        debounceTime(250),
        withLatestFrom(this.store$.select(ThemeUiStoreSelectors.selectOpen)),
        filter(([a, b]) => !b), // se il menu non è aperto dispaccio il mouseover
        map(([a, b]) => a),
        distinctUntilChanged((prev, curr) => prev === curr)
      )
      .subscribe((mouseover: boolean) => {
        console.log('SlideMenuProComponent.mouseoverSubject$()');
        console.log('mouseover: ', mouseover);
        this.store$.dispatch(ThemeUiStoreActions.Mouseover({ mouseover }));
      });

    this.store$.dispatch(
      ThemeUiStoreActions.Select({
        item: {
          data: {},
          breadcrumb: ['Home'],
        },
      })
    );
  }

  // @HostListener('document:click', ['$event', '$event.target'])
  // public onClick(event: MouseEvent, targetElement: HTMLElement): void {
  //   if (!targetElement) {
  //     return;
  //   }
  //
  //   const clickedInside = this.el.nativeElement.contains(targetElement);
  //   if (!clickedInside) {
  //     this.store$.dispatch(ThemeUiStoreActions.Open({open:false}));
  //   }
  // }

  @HostListener('mouseover')
  onMouseOver() {
    this.mouseoverSubject$.next(true);
  }

  @HostListener('mouseout')
  onMouseOut() {
    this.mouseoverSubject$.next(false);
  }

  onSelectChange($event: any) {
    console.log('SlideMenuProComponent.onSelectChange()');
    console.log('$event: ', $event);
  }
}
