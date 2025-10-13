import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RootStoreModule} from './root-store';
import {HttpClientModule} from '@angular/common/http';
import {providePrimeNG} from 'primeng/config';
import {PrimeuixPresets} from './primeuix-presets';
import {ThemeJngModule} from '@core/theme/theme-jng.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    RootStoreModule,
    HttpClientModule,
    ThemeJngModule
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
export class AppModule {
}