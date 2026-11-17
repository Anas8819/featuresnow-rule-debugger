import { Routes } from '@angular/router';

// Both pages are loaded on demand, so AG Grid (used by both) sits in its own bundle chunk, not the initial one.
export const routes: Routes = [
  { path: '', redirectTo: 'transactions', pathMatch: 'full' },
  {
    path: 'transactions',
    loadComponent: () => import('./pages/transactions-page/transactions-page.component').then((m) => m.TransactionsPage),
  },
  {
    path: 'rules',
    loadComponent: () => import('./pages/rules-page/rules-page.component').then((m) => m.RulesPage),
  },
  {
    path: 'rules/:ruleId',
    loadComponent: () => import('./pages/rules-page/rules-page.component').then((m) => m.RulesPage),
  },
];
