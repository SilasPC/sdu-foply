import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TabProfilePage } from './component';

const routes: Routes = [
  {
    path: '',
    component: TabProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabFollowersPageRoutingModule {}
