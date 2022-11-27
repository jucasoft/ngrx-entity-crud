import { Component, HostBinding, OnInit } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { ThemeUiStoreSelectors } from '../store/theme-ui-store';
import { selectMouseoverOrOpen } from '@core/theme/store/theme-ui-store/theme-ui-store.selectors';

@Component({
  selector: 'app-main',
  template: `
    <div *ngrxLet="open$; let open" class="p-0 m-0">
      <ng-content>
      </ng-content>
    </div>
  `,
  styles: [
    `

    :host {
      display:block;
      position: fixed;
      top: var(--topbar-height);;
      left: var(--menu-close-width);
      right: 0;
      bottom: var(--footer-height);
      //background-color: var(--topbar-bg-color);
      -moz-transition: left var(--menu-transition);
      -o-transition: left var(--menu-transition);
      -webkit-transition: left var(--menu-transition);
      transition: left var(--menu-transition);
    }

    .header-height{
      height: var(--topbar-height);
    }

    .header-color {
      background-color: var(--topbar-bg-color);
    }

    :host(.menu-opened) {
      left: var(--menu-width);
    }
  `,
  ],
})
export class MainComponent implements OnInit {
  open$: Observable<boolean>;

  @HostBinding('class.menu-opened')
  menuOpened = false;

  constructor(private readonly store$: Store) {}

  ngOnDestroy(): void {}

  ngOnInit() {
    this.open$ = this.store$
      .select(ThemeUiStoreSelectors.selectMouseoverOrOpen)
      .pipe(tap((value) => (this.menuOpened = value)));
  }
}
