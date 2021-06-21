import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './component';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'msgs',
        loadChildren: () => import('../pages/tab-messages/module').then(m => m.TabMessagesPageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../pages/tab-profile/module').then(m => m.TabProfilePageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/msgs',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/tabs/msgs',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
