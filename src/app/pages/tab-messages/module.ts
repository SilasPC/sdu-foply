import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TabMessagesPageRoutingModule } from './routing';
import { TabMessagesPage } from './component';
import { HeaderToolbarComponent } from '../../components/header-toolbar/component'
import { UserSearchBarComponent } from 'src/app/components/user-search-bar/component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TabMessagesPageRoutingModule,
  ],
  declarations: [
    TabMessagesPage,
    HeaderToolbarComponent,
    UserSearchBarComponent
  ]
})
export class TabMessagesPageModule {}
