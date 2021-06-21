import { Component, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, NavParams, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { State } from 'src/app/models/State';
import { User } from 'src/app/models/User';

@Component({
  selector: 'app-login',
  templateUrl: './template.html',
  styleUrls: ['./style.sass'],
})
export class LoginPage {

  public username = 'spock'
  private stateSub?: Subscription

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.stateSub = State.state$.subscribe( state => {
      if (state.user)
        return this.loginSuccess(state.user)
    })
  }

  ngOnDestroy() {
    if (this.stateSub)
      this.stateSub.unsubscribe()
  }

  async ionViewWillEnter() {
    const user = State.getState().user
    if (user) await this.loginSuccess(user)
  }

  async signIn() {
    const user = await User.byId(this.username)
    if (user) {
      await State.signIn(user) // triggers login
    } else await this.showToast('User not found')
  }

  async signUp() {
    const alert = await this.alertCtrl.create({
      header: 'Sign up',
      message: 'The best decision you\'ve made today!',
      inputs: [{
        name: 'id',
        type: 'text',
        placeholder: 'Username'
      },{
        name: 'name',
        type: 'text',
        placeholder: 'Full name'
      }],
      buttons: [{
        text: 'Sign up!',
        handler: ({id,name}) => {
          this.signUpHandler(id,name,alert)
          return false
        }
      },{
        text: 'Cancel',
        role: 'cancel'
      }]
    })
    return await alert.present()
  }

  async signUpHandler(id:string, name:string, alert: HTMLIonAlertElement) {
    if (!User.checkValidId(id))
      await this.showToast('Invalid id')
    else if (!User.checkValidName(name))
      await this.showToast('Invalid name')
    else {
      const user = await User.tryCreate(id, name)
      if (!user)
        await this.showToast('Username already taken')  
      else {
        await alert.dismiss()
        await State.signIn(user) // triggers login
      }
    }
  }

  async loginSuccess(user: User, showPswNote = false) {
    if (showPswNote) {
      const alert = await this.alertCtrl.create({
        header: 'Notification',
        message: 'We are experiencing some technical problems,' + 
          ' so we have currently disabled passwords. Hoply is' +
          ' neither responsible nor liable for any consequences hereof.',
        /*inputs: [{
          type: 'checkbox',
          name: 'hide',
          label: `Don't show this again`,
          value: 'hide',
          checked: false
        }],*/
        buttons: [{
          text: 'Ok!',
          handler: () => {
            this.router.navigateByUrl('/tabs')
          }
        }]
      })
      await alert.present()
    } else {
      this.router.navigateByUrl('/tabs')
    }
  }

  async showToast(message:string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000
    })
    await toast.present()
  }

}
