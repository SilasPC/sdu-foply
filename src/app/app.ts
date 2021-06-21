import { Component } from '@angular/core';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ImagePicker } from '@ionic-native/image-picker/ngx';
// import { NativeGeocoder } from '@ionic-native/native-geocoder';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/login',
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/module').then( m => m.LoginPageModule)
  },
  {
    path: 'msg-thread',
    loadChildren: () => import('./pages/msg-thread/module').then( m => m.MsgThreadPageModule)
  },
  {
    path: 'messages',
    loadChildren: () => import('./pages/tab-messages/module').then( m => m.TabMessagesPageModule)
  },
  {
    path: 'tab-profile',
    loadChildren: () => import('./pages/tab-profile/module').then( m => m.TabProfilePageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/module').then( m => m.TabsPageModule)
  }
]

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}

@Component({
  selector: 'app-root',
  template: '<ion-app><ion-router-outlet></ion-router-outlet></ion-app>'
})
export class AppComponent {}

@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'md'
    }),
    AppRoutingModule
  ],
  providers: [
    {
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    },
    ImagePicker,
    // NativeGeocoder
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}