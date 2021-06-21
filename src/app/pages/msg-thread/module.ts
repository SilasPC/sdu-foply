import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MsgThreadPageRoutingModule } from './routing';

import { MsgThreadPage } from './component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MsgThreadPageRoutingModule
  ],
  declarations: [
    MsgThreadPage
  ]
})
export class MsgThreadPageModule {}
