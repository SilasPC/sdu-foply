import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TabFollowersPageRoutingModule } from './routing';

import { TabProfilePage } from './component';
import { HeaderToolbarComponent } from 'src/app/components/header-toolbar/component';
import { EditFieldComponent } from 'src/app/components/edit-field/component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabFollowersPageRoutingModule
  ],
  declarations: [TabProfilePage, HeaderToolbarComponent, EditFieldComponent]
})
export class TabProfilePageModule {}
