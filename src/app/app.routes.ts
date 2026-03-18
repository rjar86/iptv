import { Routes } from '@angular/router';
import { Layout } from '../layout/layout';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '',
    component: Layout,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../pages/home/home.routes').then((m) => m.default),
      },
      {
        path: 'guia',
        loadChildren: () => import('../pages/guide/guide.routes').then((m) => m.default),
      },
      {
        path: 'acerca',
        loadChildren: () => import('../pages/about/about.routes').then((m) => m.default),
      },
    ],
  },
  {
    path: 'error',
    loadChildren: () => import('../pages/error-page/error-page.routes').then((m) => m.default),
  },
  {
    path: '**',
    redirectTo: 'error',
  },
];
