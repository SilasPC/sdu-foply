import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MsgThreadPage } from '../msg-thread/component';

import { TabMessagesPage } from './component';

const routes: Routes = [
  {
    path: '',
    component: TabMessagesPage,
    children: [{
      path: 'thread',
      component: MsgThreadPage
      //loadChildren: () => import('../msg-thread/module')
      //  .then(m => m.MsgThreadPageModule)
    }]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabMessagesPageRoutingModule {}
