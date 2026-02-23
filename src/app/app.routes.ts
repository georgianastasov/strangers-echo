import { Routes } from '@angular/router';
import { HomeComponent } from './home/home';
import { StatsComponent } from './stats/stats';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'stats', component: StatsComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' },
];
