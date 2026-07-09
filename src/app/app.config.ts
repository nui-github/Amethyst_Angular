import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeTh from '@angular/common/locales/th';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { NZ_I18N, th_TH } from 'ng-zorro-antd/i18n';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { routes } from './app.routes';

registerLocaleData(localeTh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(),
    importProvidersFrom(NzMessageModule),
    { provide: NZ_I18N, useValue: th_TH },
  ],
};
