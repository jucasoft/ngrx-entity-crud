import {ChangeDetectionStrategy, Component, inject, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {RootStoreSelectors, RootStoreState} from '@root-store/index';
import {Observable} from 'rxjs';
import {ProgressBar} from 'primeng/progressbar';
import {AsyncPipe, NgIf} from '@angular/common';

@Component({
  selector: 'app-progress',
  template: `
    <p-progressBar *ngIf="isLoading$ | async"
                   [style]="{'height': 'var(--loader-height)', 'border-radius': '0px', 'background-color': 'var(--p-primary-300)'}"
                   mode="indeterminate"></p-progressBar>
  `,
  styles: [`
    :host {
      top: 0;
      left: 0;
      right: 0;
      height: var(--loader-height);
    }
  `],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressComponent implements OnInit {
  private store$ = inject(Store);

  constructor() {
  }

  isLoading$: Observable<boolean>;

  ngOnInit() {
    this.isLoading$ = this.store$.select(RootStoreSelectors.selectIsLoading);
  }

}
