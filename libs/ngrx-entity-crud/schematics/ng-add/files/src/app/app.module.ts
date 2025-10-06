import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RootStoreModule} from './root-store';
import {HttpClientModule} from '@angular/common/http';
import {SlideMenuProComponent} from '@core/theme/components/slide-menu-pro.component';
import {HeaderComponent} from '@core/theme/components/header.component';
import {FooterComponent} from '@core/theme/components/footer.component';
import {MainComponent} from '@core/theme/components/main.component';
import {ProgressComponent} from '@core/theme/components/progress.component';
import {providePrimeNG} from 'primeng/config';
import {PrimeuixPresets} from './primeuix-presets';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    RootStoreModule,
    HttpClientModule,
    SlideMenuProComponent,
    HeaderComponent,
    FooterComponent,
    MainComponent,
    ProgressComponent
  ],
  providers: [
    providePrimeNG({
      theme: {
        preset: PrimeuixPresets, // Qui definisci il tema per tutta l'app
        options: {
          // darkModeSelector: false
        }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
