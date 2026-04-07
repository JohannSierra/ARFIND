import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { RoleGuard } from './services/role.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () =>
      import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./admin/admin.module').then(m => m.AdminPageModule),
    canActivate: [RoleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'home',
    loadChildren: () =>
      import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [RoleGuard],
    data: {
      roles: [
        'Cajero',
        'Cocinero',
        'Mantenimiento',
        'Limpieza',
        'Almacenista'
      ]
    }
  },
  {
    path: 'almacen',
    loadChildren: () =>
      import('./almacen/almacen.module').then(m => m.AlmacenPageModule),
    canActivate: [RoleGuard],
    data: { roles: ['Administrador', 'Almacenista'] }
  },
  {
    path: 'registro',
    loadChildren: () =>
      import('./registro/registro.module').then(m => m.RegistroPageModule),
    canActivate: [RoleGuard],
    data: { roles: ['Administrador'] }
  },
  {
    path: 'registroalmacen',
    loadChildren: () =>
      import('./registroalmacen/registroalmacen.module')
        .then(m => m.RegistroalmacenPageModule)
  },
  {
    path: 'historial-prestamos',
    loadChildren: () => import('./historial-prestamos/historial-prestamos.module').then( m => m.HistorialPrestamosPageModule),
    canActivate: [RoleGuard],
    data: { roles: ['Cajero', 'Cocinero', 'Mantenimiento', 'Limpieza', 'Almacenista', 'Administrador'] }
  },

  // SIEMPRE AL FINAL
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
