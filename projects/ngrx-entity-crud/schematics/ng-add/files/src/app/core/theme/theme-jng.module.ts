import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './components/footer.component';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { LetModule } from '@ngrx/component';
import { HeaderComponent } from './components/header.component';
import { MainComponent } from './components/main.component';
import { ProgressBarModule } from 'primeng/progressbar';
import { MenuModule } from 'primeng/menu';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SlideMenuComponent } from './components/slide-menu.component';
import { ThemeUiStoreModule } from './store/theme-ui-store';
import { ProgressComponent } from './components/progress.component';
import { SlideMenuProComponent } from '@core/theme/components/slide-menu-pro.component';
import { MenuItemComponent } from './components/menu-item.component';
import { AvatarModule } from 'primeng/avatar';

@NgModule({
  declarations: [
    FooterComponent,
    HeaderComponent,
    MainComponent,
    SlideMenuComponent,
    ProgressComponent,
    SlideMenuProComponent,
    MenuItemComponent,
  ],
  exports: [
    FooterComponent,
    HeaderComponent,
    MainComponent,
    SlideMenuComponent,
    ProgressComponent,
    SlideMenuProComponent,
  ],
  imports: [
    CommonModule,
    OverlayPanelModule,
    LetModule,
    ProgressBarModule,
    ThemeUiStoreModule,
    MenuModule,
    ScrollPanelModule,
    AvatarModule,
  ],
})
export class ThemeJngModule {}
