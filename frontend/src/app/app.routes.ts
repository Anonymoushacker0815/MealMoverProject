import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Forum } from './pages/forum/forum';
import { Authentication } from './pages/authentication/authentication';
import { Manager } from './pages/manager/manager';
import { User } from './pages/user/user';
import { Owner } from './pages/owner/owner';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'forum', component: Forum },
  { path: 'authentication', component: Authentication },
  { path: 'manager', component: Manager },
  { path: 'user', component: User },
  { path: 'owner', component: Owner },
  {
  path: 'forum/new',
    loadComponent: () =>
      import('./pages/forum/new-thread/new-thread')
        .then(m => m.NewThreadComponent),
  }
];
