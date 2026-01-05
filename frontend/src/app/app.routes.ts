import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Forum } from './pages/forum/forum';
import { Authentication } from './pages/authentication/authentication';
import { Manager } from './pages/manager/manager';
import { User } from './pages/user/user';
import { Owner } from './pages/owner/owner';
import {Account} from './pages/account/account';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'authentication', component: Authentication },
  { path: 'manager', component: Manager },
  { path: 'user', component: User },
  { path: 'owner', component: Owner },
  {
    path: 'owner/orders',
    loadComponent: () =>
      import('./pages/owner/orders/orders')
        .then(m => m.OwnerOrders),
  },
  {
    path: 'owner/menu',
    loadComponent: () =>
      import('./pages/owner/menu/menu')
        .then(m => m.OwnerMenu),
  },
  {
    path: 'owner/analytics',
    loadComponent: () =>
      import('./pages/owner/analytics/analytics')
        .then(m => m.OwnerAnalytics),
  },
  {
    path: 'owner/profile',
    loadComponent: () =>
      import('./pages/owner/profile/profile')
        .then(m => m.OwnerProfile),
  },
  {
    path: 'forum/new',
    loadComponent: () =>
      import('./pages/forum/new-thread/new-thread')
        .then(m => m.NewThreadComponent),
  },
  {
    path: 'forum/:id',
    loadComponent: () =>
      import('./pages/forum/thread-detail/thread-detail')
        .then(m => m.ThreadDetailComponent),
  },
  { path: 'forum', component: Forum },
  { path: 'account', component: Account },
];
