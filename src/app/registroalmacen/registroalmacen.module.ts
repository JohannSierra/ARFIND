import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegistroalmacenPageRoutingModule } from './registroalmacen-routing.module';

import { RegistroalmacenPage } from './registroalmacen.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegistroalmacenPageRoutingModule
  ],
  declarations: [RegistroalmacenPage]
})
export class RegistroalmacenPageModule {}
