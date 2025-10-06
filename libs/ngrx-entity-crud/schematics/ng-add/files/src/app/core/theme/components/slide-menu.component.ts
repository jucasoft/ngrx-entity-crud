import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {MenuItem} from 'primeng/api';
import {Observable, tap} from 'rxjs';
import {menuItemsDecorator} from '../store/theme-ui-store/operators';
import {ThemeUiStoreActions, ThemeUiStoreSelectors,} from '../store/theme-ui-store';
import {MenuItemComponent} from '@core/theme/components/menu-item.component';
import {ScrollPanel} from 'primeng/scrollpanel';
import {Menu} from 'primeng/menu';
import {AsyncPipe} from '@angular/common';
import {LetDirective} from '@ngrx/component';

@Component({
  selector: 'app-slide-menu',
  template: `
    <div *ngrxLet="open$; let open"
         class="flex justify-content-between flex-wrap text-white m-0 px-2 header-height header-color">
      <div class="flex-none flex align-items-center justify-content-center text-4xl font-medium">
        Menù
      </div>
    </div>
    <app-menu-item></app-menu-item>
    <app-menu-item></app-menu-item>
    <app-menu-item></app-menu-item>
    <app-menu-item></app-menu-item>
    <app-menu-item></app-menu-item>
    <p-scrollPanel>
      <p-menu [model]="items$ | async" styleClass="w-full"></p-menu>
    </p-scrollPanel>
  `,
  styles: [
    `
      :host {
        display: block;
        top: 0;
        left: 0;
        width: var(--menu-width);
        height: 100vh;
        margin-left: var(--menu-close-margin-left);
        position: fixed;
        border-right: solid 1px var(--menu-border-right);
        background-color: var(--sidebar-bg-color);
        -moz-transition: var(--menu-transition);
        -o-transition: var(--menu-transition);
        -webkit-transition: var(--menu-transition);
        transition: var(--menu-transition);
      }

      .header-height {
        height: var(--topbar-height);
      }

      .header-color {
        background-color: var(--topbar-bg-color);
      }

      :host(.menu-opened) {
        margin-left: 0;
      }

    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MenuItemComponent,
    ScrollPanel,
    Menu,
    AsyncPipe,
    LetDirective
  ]
})
export class SlideMenuComponent implements OnInit, OnDestroy {
  private store$ = inject(Store);
  private el = inject(ElementRef);

  constructor() {
  }

  open$: Observable<boolean> = this.store$
    .select(ThemeUiStoreSelectors.selectMouseoverOrOpen)
    .pipe(tap((value) => (this.menuOpened = value)));

  items$: Observable<MenuItem[]> = this.store$.pipe(
    select(ThemeUiStoreSelectors.selectItems),
    menuItemsDecorator(this.store$)
  );

  @HostBinding('class.menu-opened')
  menuOpened = false;

  ngOnDestroy(): void {
  }

  // todo: completare profilazione dei pulsanti.
  ngOnInit(): void {

    this.store$.dispatch(
      ThemeUiStoreActions.Select({
        item: {
          data: {},
          breadcrumb: ['Home'],
        },
      })
    );
  }

  @HostListener('document:click', ['$event', '$event.target'])
  public onClick(event: MouseEvent, targetElement: HTMLElement): void {
    if (!targetElement) {
      return;
    }

    const clickedInside = this.el.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.store$.dispatch(ThemeUiStoreActions.Open({open: false}));
    }
  }
}
