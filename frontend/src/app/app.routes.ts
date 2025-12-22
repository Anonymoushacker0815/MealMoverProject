import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Forum } from './pages/forum/forum';
import { Authentication } from './pages/authentication/authentication';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'forum', component: Forum },
  { path: 'authentication', component: Authentication },
  { path: '**', redirectTo: '' },
];
