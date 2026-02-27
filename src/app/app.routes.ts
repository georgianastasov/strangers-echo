import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'stats', loadComponent: () => import('./stats/stats').then((m) => m.StatsComponent) },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
