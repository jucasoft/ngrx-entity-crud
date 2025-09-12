import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { RouterStoreSelectors } from '@root-store/router-store';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-menu-item',
  template: `
    <div (click)="onClick($event)" class="flex align-items-center justify-content-start h-3rem overflow-hidden text-base flex-nowrap menu-item-bg-color">
      <div class="item-cursor h-full" [ngClass]="(routerLinkActive$ | async) ? 'bg-red-500' : 'bg-gray-500'"></div>
      <div class="item-icon h-full text-white flex align-items-center justify-content-center flex-nowrap">
        <em [class]="item.icon"></em>
      </div>
      <div class="item-text w-full h-full text-white flex align-items-center justify-content-start min-w-max">
        <span >{{item.label}}</span>
      </div>
    </div>
  `,
  styles: [
    `
    .item-cursor{
      min-width: 0.2rem;
      width: 0.2rem;
    }

    .item-icon{
      min-width: 4.8rem;
      width: 4.8rem;
    }

    .menu-item-bg-color{
      background-color: var(--menu-item-bg-color);
    }

    .mw-4rem {
      min-width: 4rem !important;
    }

    .mw-1rem {
      min-width: 1rem !important;
    }

    .menu-item{
      width: var(--menu-width);
    }

    :host(:hover){
      opacity: 0.5;
      cursor: pointer;
    }
  `,
  ],
})
export class MenuItemComponent implements OnInit {
  @Input()
  open: boolean;

  @Input()
  item: MenuItem;

  @Output()
  onSelectChange = new EventEmitter();

  @Input()
  index: number;

  routerLinkActive$: Observable<boolean>;

  constructor(private store$: Store) {}

  ngOnInit(): void {
    this.routerLinkActive$ = this.store$
      .select(RouterStoreSelectors.selectUrl)
      .pipe(
        map((selectUrl: string) => selectUrl || ''),
        map((selectUrl: string) => {
          return selectUrl.indexOf(this.item.url || '') !== -1;
        })
      );
  }

  onClick($event: MouseEvent) {
    console.log('MenuItemComponent.onClick()');
    console.log('$event: ', $event);
    this.onSelectChange.emit(this.item);
  }
}
