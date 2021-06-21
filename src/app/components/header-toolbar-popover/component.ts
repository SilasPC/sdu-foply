import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { PopoverController } from '@ionic/angular';
import { State } from 'src/app/models/State';
import * as Storage from '../../models/Storage'

/** Component representing the pop-over showed by `HeaderToolbarComponent` */
@Component({
  selector: 'app-header-toolbar-popover',
  templateUrl: './template.html',
})
export class HeaderToolbarPopoverComponent {

  /** Current dark mode setting */
  public darkMode = this.isDarkOn()
  
  public readonly showDebugOptions = true

  constructor(
    private router: Router,
    private popCtrl: PopoverController
  ) {}

  /** Sign out user and navigate to login screen */
  async signOut() {
    await State.signOut()
    await this.popCtrl.dismiss()
    await this.router.navigateByUrl('/login')
  }

  /** Switch change handler */
  darkModeChanged(shouldBeDarkMode: boolean) {
    const cl = document.body.classList
    if (shouldBeDarkMode) {
      cl.add('dark')
      cl.remove('no-dark')
    } else {
      cl.add('no-dark')
      cl.remove('dark')
    }
  }

  /** Clear local database */
  async resetStorage() {
    await Storage.reset()
    await this.popCtrl.dismiss()
  }

  /** Reset global app state */
  async resetState() {
    State.reset()
    await this.popCtrl.dismiss()
  }

  /** Check if dark mode is enabled. */
  private isDarkOn() {
    // Check media query for prefering dark colors
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const cl = document.body.classList
    const classDark = cl.contains('dark')
    const classNoDark = cl.contains('no-dark')
    return classDark || (prefersDark && !classNoDark)
  }

}
