import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {RootStoreState} from '../../root-store';
// import {DialogService} from 'primeng/api';
import {RouterStoreSelectors} from '@root-store/router-store/index';
import {take} from 'rxjs/operators';
import {evalData} from '@core/utils/j-utils';
// import {ConfirmDialogComponent} from '@core/components/confirm-dialog/confirm-dialog.component';
import {Subscription} from 'rxjs';
import {FormBuilder} from '@angular/forms';

@Component({
    selector: 'app-pop-up-base',
    template: ``,
    styles: []
})
export class PopUpBaseComponent<T> implements OnInit, OnDestroy {


    constructor(protected store$: Store<RootStoreState.State>,
                protected ref: ChangeDetectorRef,
                // protected dialogService: DialogService,
                protected fb: FormBuilder
    ) {
        ref.detach();
    }

    private subscription: Subscription;

    ngOnInit() {
        this.subscription = this.store$.select(RouterStoreSelectors.selectExtra).pipe(
            take(1),
        ).subscribe(
            value => this.setItem(evalData(() => value.state as T, null))
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
    }

    setItem(value: T): void {
        this.setItemPerform(value);
        this.ref.reattach();
        this.ref.markForCheck();
    }


    submit(value): void {
        // this.dialogService.open(ConfirmDialogComponent, {
        //     transitionOptions:'0ms',
        //         data: {
        //             message: 'Are you sure?',
        //             accept: () => {
        //                 this.acceptPerform(value)
        //             }
        //         },
        //         header: 'Confirm'
        //     }
        // )
    }

    setItemPerform(value: T): void {
        throw new Error('Metodo da sovrascrivere')
    };

    acceptPerform(value): void {
        throw new Error('Metodo da sovrascrivere')
    };

    cancel(): void {
        this.onClose();
    }

    onClose() {
        throw new Error('Metodo da sovrascrivere')
        // this.store$.dispatch(RouterStoreActions.RouterGo({path: ['task', {outlets: {popUp: null}}]}));
    }
}
