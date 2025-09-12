import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {RootStoreSelectors, RootStoreState} from '@root-store/index';
import {Observable} from 'rxjs';

@Component({
  selector: 'app-progress',
  template: `
    <p-progressBar *ngIf="isLoading$ | async"
                   [style]="{'height': 'var(--loader-height)', 'border-radius': '0px', 'background-color': 'var(--primary-300)'}"
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
  changeDetection:ChangeDetectionStrategy.OnPush
})
export class ProgressComponent implements OnInit {

  constructor(private readonly store$: Store<RootStoreState.State>) {
  }

  isLoading$: Observable<boolean>;

  ngOnInit() {
    this.isLoading$ = this.store$.select(RootStoreSelectors.selectIsLoading);
  }

}
