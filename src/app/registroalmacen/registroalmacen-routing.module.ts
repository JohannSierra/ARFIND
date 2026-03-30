import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistroalmacenPage } from './registroalmacen.page';

const routes: Routes = [
  {
    path: '',
    component: RegistroalmacenPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegistroalmacenPageRoutingModule {}
