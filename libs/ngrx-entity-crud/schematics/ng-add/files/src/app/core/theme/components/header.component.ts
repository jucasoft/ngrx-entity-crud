import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  OnInit,
} from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import {
  ThemeUiStoreActions,
  ThemeUiStoreSelectors,
} from '../store/theme-ui-store';

@Component({
  selector: 'app-header',
  template: `
    <header class="flex justify-content-between flex-nowrap text-white m-0 header-height overflow-auto">
      <div class="flex-none flex align-items-center justify-content-center">
        <div *ngrxLet="open$; let open">
          <em class="pi  icon-button" [pTooltip]="open ? '' : 'pin opened menu'" [ngClass]="open ? 'pi-times' : 'pi-bars'"
              (click)="onShowMenu($event,open)"></em>
        </div>
      </div>
      <div class="flex-none flex align-items-center justify-content-center text-4xl font-medium">
        Title
      </div>
      <div class="flex-none flex align-items-center justify-content-center gap-2">
        <i class="pi pi-image"></i>
        <i class="pi pi-bell"></i>
        <i class="pi pi-user mr-2"></i>
      </div>
    </header>
  `,
  styles: [
    `

    :host {
      display:block;
      position: fixed;
      top: 0;
      left: var(--menu-close-width);
      right: 0;
      background-color: var(--topbar-bg-color);
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  open$: Observable<boolean>;

  @HostBinding('class.menu-opened')
  menuOpened = false;

  constructor(private readonly store$: Store) {}

  ngOnInit() {
    this.open$ = this.store$
      .select(ThemeUiStoreSelectors.selectMouseoverOrOpen)
      .pipe(tap((value) => (this.menuOpened = value)));
  }

  onShowMenu($event: any, value: any) {
    $event.stopPropagation();
    this.store$.dispatch(ThemeUiStoreActions.Open({ open: !value }));
  }
}
