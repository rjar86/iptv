import { Routes } from '@angular/router';
import { Layout } from '../layout/layout';

export const routes: Routes = [
  {
    path: '', pathMatch: 'full', redirectTo: 'home'
  },
  {
    path: '',
    component: Layout,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../pages/home/home.routes')
      },
      {
        path: 'guia',
        loadChildren: () => import('../pages/guide/guide.routes')
      },
      {
        path: 'acerca',
        loadChildren: () => import('../pages/about/about.routes')
      }
    ]
  },
  {
    path: 'error',
    loadChildren: () => import('../pages/error-page/error-page.routes')
  },
  {
    path: '**', redirectTo: 'error'
  },
];
