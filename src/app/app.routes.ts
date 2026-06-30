import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/chat/chat-page/chat-page.component')
      .then(m => m.ChatPageComponent),
  },
  {
    path: 'queue',
    loadComponent: () => import('./features/queue/queue-page/queue-page.component')
      .then(m => m.QueuePageComponent),
  },
  {
    path: 'print/license',
    loadComponent: () => import('./features/print/license-print/license-print.component')
      .then(m => m.LicensePrintComponent),
  },
  {
    path: 'settings',
    loadComponent: () => import('./features/settings/settings-page/settings-page.component')
      .then(m => m.SettingsPageComponent),
  },
  {
    path: 'billing',
    loadComponent: () => import('./features/billing/billing-page/billing-page.component')
      .then(m => m.BillingPageComponent),
  },
  { path: '**', redirectTo: '' },
];
