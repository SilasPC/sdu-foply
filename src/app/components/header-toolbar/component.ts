import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { HeaderToolbarPopoverComponent } from '../header-toolbar-popover/component';

/** Component representing a header toolbar for tabs */
@Component({
  selector: 'app-header-toolbar',
  templateUrl: './template.html'
})
export class HeaderToolbarComponent {

  @Input()
  public title: string = ''

  @Output()
  public clickUserIcon = new EventEmitter()

  constructor(
    private popCtrl: PopoverController
  ) {}

  async showOptions(event: any) {
    const pop = await this.popCtrl.create({
      component: HeaderToolbarPopoverComponent,
      event
    })
    await pop.present()
  }

}
