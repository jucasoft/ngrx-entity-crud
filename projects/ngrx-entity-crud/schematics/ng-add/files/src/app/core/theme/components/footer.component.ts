import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';

@Component({
  selector: 'app-footer',
  template: `
    <footer class="footer">
            <div class="float-left">
              <small>&#160;footer&#160;</small>
            </div>
    </footer>
  `,
  styles: [
    `

    :host {
      position: fixed;
      bottom: 0;
      width: 100%;
      min-height: var(--footer-height);
      background-color: var(--footer-bg-color);
      border-top: 1px dotted var(--footer-border-color);
      padding-left: 1em;
      padding-right: 1em;
      -webkit-box-shadow: 0 -1px 3px 1px rgba(0, 0, 0, 0.1);
      -moz-box-shadow: 0 -1px 3px 1px rgba(0, 0, 0, 0.1);
      box-shadow: 0 -1px 3px 1px rgba(0, 0, 0, 0.1);
    }

    :host(.menu-opened) {
      left: var(--menu-width);
    }

  `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent implements OnInit {
  constructor(private readonly store$: Store) {}

  ngOnInit() {}
}
