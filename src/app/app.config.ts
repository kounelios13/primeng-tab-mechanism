import { ApplicationConfig, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';
import { providePrimeNG } from 'primeng/config';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import Aura from '@primeng/themes/aura';

import { routes } from './app.routes';
import { tabFeature, innerTabFeature } from './store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), 
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Aura
      }
    }),
    provideStore({ 
      [tabFeature.name]: tabFeature.reducer,
      [innerTabFeature.name]: innerTabFeature.reducer
    }),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() })
  ]
};
