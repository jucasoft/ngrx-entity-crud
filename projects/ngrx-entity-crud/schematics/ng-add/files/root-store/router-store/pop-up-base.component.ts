import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {RouterStoreActions, RouterStoreSelectors} from '@root-store/router-store/index';
import {take} from 'rxjs/operators';
import {evalData} from '@core/utils/j-utils';
import {Subscription} from 'rxjs';
import {ConfirmationService} from 'primeng/api';
import {State} from '@root-store/state';
import {FormBuilder} from '@angular/forms';

@Component({
  selector: 'app-pop-up-base',
  template: ``,
  styles: []
})
export class PopUpBaseComponent<T> implements OnInit, OnDestroy {

  public title: string;
  public route: string;
  public confirmMessage = 'Are you sure that you want to perform this action?';
  protected state: PopUpData<T>;
  private subscription: Subscription;

  constructor(protected store$: Store<State>,
              protected ref: ChangeDetectorRef,
              protected confirmationService: ConfirmationService,
              protected fb: FormBuilder,
  ) {
    ref.detach();
  }

  ngOnInit() {
    this.subscription = this.store$.select(RouterStoreSelectors.selectPopUp).pipe(
      take(1),
    ).subscribe(
      data => this.setState(evalData(() => data as PopUpData<T>, null))
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  setState(value: PopUpData<T>): void {
    if (value.props) {
      this.title = value.props.title || this.title;
      this.route = value.props.route || this.route;
      this.confirmMessage = value.props.confirmMessage || this.confirmMessage;
    }

    this.setItemPerform(value.item);
    this.ref.reattach();
    this.ref.markForCheck();
  }

  submit(value): void {
    this.confirmationService.confirm({
      message: this.confirmMessage,
      accept: () => {
        this.acceptPerform(value);
      }
    });
  }

  setItemPerform(value: T): void {
    throw new Error('Metodo da sovrascrivere');
  }

  acceptPerform(item: T): void {
    throw new Error('Metodo da sovrascrivere');
  }

  cancel(): void {
    this.store$.dispatch(closePopUpAction);
  }
}

export class PopUpData<T> {
  item: T;
  props: Partial<{ title: string, route: string, confirmMessage: string }>;
}

export const closePopUpAction = RouterStoreActions.RouterBack();
