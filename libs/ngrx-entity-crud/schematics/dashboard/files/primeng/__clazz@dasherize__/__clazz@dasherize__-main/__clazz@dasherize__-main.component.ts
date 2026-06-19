import {ChangeDetectionStrategy, Component} from '@angular/core';

/**
 * Wrapper PrimeNG che ospita <nec-dashboard> (esportato da `ngrx-entity-crud/devtools`).
 * Tutta la logica di diagnostica vive nella libreria: qui resta solo il "chrome".
 */
@Component({
  selector: 'app-<%= dasherize(clazz) %>-main',
  templateUrl: '<%= dasherize(clazz) %>-main.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class <%= clazz %>MainComponent {
}
