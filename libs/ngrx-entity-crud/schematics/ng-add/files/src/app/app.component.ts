import { Component } from '@angular/core';
import {SlideMenuProComponent} from '@core/theme/components/slide-menu-pro.component';
import {HeaderComponent} from '@core/theme/components/header.component';
import {FooterComponent} from '@core/theme/components/footer.component';
import {MainComponent} from '@core/theme/components/main.component';
import {ProgressComponent} from '@core/theme/components/progress.component';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SlideMenuProComponent,
    HeaderComponent,
    FooterComponent,
    MainComponent,
    ProgressComponent,
    RouterOutlet
  ],
  templateUrl: './app.component.html'
})
export class AppComponent {
}