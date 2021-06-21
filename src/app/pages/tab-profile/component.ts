import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { State } from 'src/app/models/State';
import { User } from 'src/app/models/User';

@Component({
  selector: 'app-tab-profile',
  templateUrl: './template.html',
})
export class TabProfilePage {

  public followers: User[] = []
  public followees: User[] = []
  public segmentChoice = 'followers'

  public userName$ = State.state$.pipe(map(s => s.user?.name ?? ''))
  private stateSub: Subscription

  constructor() {
    this.stateSub = State.state$.subscribe( () => this.update() )
    this.update()
  }

  ngOnDestroy() {
    this.stateSub.unsubscribe()
  }

  async doRefresh(ev: any) {
    await this.update()
    ev?.target?.complete()
  }

  async editUserName(newName: string): Promise<string | null> {
    newName = newName.trim()
    if (!User.checkValidName(newName))
      return null
    const user = State.getState().user
    if (!user) return null
    return (await user.update(newName)) ? newName : null
  }

  async update() {
    const state = State.getState()
    const data = await state.user?.getFollowData()
    this.followers = data?.followers ?? []
    this.followees = data?.followed ?? []
  }

  async doFollow(follower: User) {
    await State.getState().user?.startFollow(follower)
  }

}
