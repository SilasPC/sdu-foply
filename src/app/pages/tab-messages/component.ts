import { Component } from '@angular/core';
import { IonItemSliding, ModalController } from '@ionic/angular';
import { prettyTimeDifference } from 'src/app/util/humanify';
import { MsgThreadPage } from '../msg-thread/component';
import { User } from 'src/app/models/User';
import { State, StateData } from 'src/app/models/State';
import { ChatManager, ChatWithUser } from 'src/app/models/ChatManager';
import { Chat } from 'src/app/models/Chat';
import { RouterPage } from 'src/app/util/RouterPage';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MsgPart } from 'src/app/models/Msg';

User.search('name of *')
	.then(u => Promise.all(u?.map(u=>u.update(u.name.slice(8))) as any))
	.then(console.log)

@Component({
	selector: 'app-messages',
	templateUrl: 'template.html'
})
export class TabMessagesPage extends RouterPage {

	private now = Date.now()

	/** Number of milliseconds between polls */
	private static readonly POLL_INTERVAL = 10000

	public chatManager: ChatManager | null = null
	
	private readonly stateSub: Subscription

	constructor(
		private modalCtrl: ModalController,
		activatedRoute: ActivatedRoute,
		router: Router
	) {
		super(router, activatedRoute)
		this.stateSub = State.state$.subscribe( state => {
			if (!this.stateMatches(state)) {
				if (state.user)
					this.init(state.user)
						.catch(console.error)
				else
					this.chatManager = null
			}
		})
	}

	ngOnDestroy() {
		super.ngOnDestroy()
		this.stateSub.unsubscribe()
		this.setPolling(false)
	}

	/** Called when page enters view */
	async onEnter() {
		const state = State.getState()
		if (state.user && !this.stateMatches(state))
			await this.init(state.user)
		else
			await this.chatManager?.sync()
		this.setPolling(true)
		this.now = Date.now()
	}

	/** Initialize page state */
	private async init(user: User) {
		this.chatManager = await ChatManager.forUser(user)
		await this.chatManager.sync()
		this.setPolling(true)
		this.now = Date.now()
	}

	changeTab() {
		// this.tabs.select('followers')
	}

	/** Pull-to-refresh handler */
	async doRefresh(ev: any) {
		const state = State.getState()
		if (!this.stateMatches(state)) {
			if (state.user)
				await this.init(state.user)
			else
				this.chatManager = null
		} else await this.chatManager?.sync()
		this.setPolling(true)
		this.now = Date.now()
		ev?.target?.complete()
	}

	async openThread(chatwu: ChatWithUser, slide: IonItemSliding) {
		slide.close()
		if (!this.chatManager) return
		const chat = new Chat(this.chatManager, this.chatManager.sender, chatwu.user, chatwu)
		const draft = chatwu.data.draft
		const modal = await this.modalCtrl.create({
			component: MsgThreadPage,
			componentProps: { chat, draft }
		})
		await modal.present()
		await this.chatManager.markThreadUnread(chatwu, false)
		this.setPolling(false)
		chatwu.data.draft = (await modal.onDidDismiss()).data
		this.setPolling(true)
	}

	/** Toggle the chat as marked unread */
	toggleUnread(chat: ChatWithUser, slide: IonItemSliding) {
		this.chatManager?.markThreadUnread(chat, !chat.data.unread)
		slide.close()
	}

	/** Humanize time difference */
	prettyStamp(unix: number) {
		return prettyTimeDifference(this.now-unix)
	}

	/** Turn a message body into a text-preview */
	truncate(body: string | MsgPart[]): string {
		const MAX_LEN = 20;
		if (typeof body == 'string')
			return body.length > MAX_LEN
				? body.slice(0, MAX_LEN-3) + '...'
				: body
		if (body[0].type == 'TXT')
			return this.truncate(body[0].body)
		return '...'
	}

	/** Create and show a new chat thread */
	async newThread(user: User) {
		if (!this.chatManager) return

		const chat = new Chat(this.chatManager, this.chatManager.sender, user)
		const draft = chat.chat.data.draft
		const modal = await this.modalCtrl.create({
			component: MsgThreadPage,
			componentProps: { chat, draft }
		})
		await modal.present()
		this.setPolling(false)
		chat.chat.data.draft = (await modal.onDidDismiss()).data
		this.setPolling(true)
	}

	/** Check that the current page state matches some global app state */
	private stateMatches(state: StateData) {
		// console.log(this.chatManager,state,State)
		if (this.chatManager && state.user)
			return this.chatManager.sender.id == state.user.id
		if (this.chatManager || state.user)
			return false
		return this.chatManager == state.user
	}

	private pollingInterval: any | null = null
	/** Start/stop polling for new message data */
	private setPolling(poll: boolean) {
		if (poll && this.pollingInterval == null) {
			this.pollingInterval = setInterval(
				() => this.chatManager
					?.sync()
					?.catch(console.error),
				TabMessagesPage.POLL_INTERVAL
			) as any
			this.chatManager
				?.sync()
				?.catch(console.error)
		} else if (!poll && this.pollingInterval != null) {
			clearInterval(this.pollingInterval)
			this.pollingInterval = null
		}
	}

	// private logRet(...args:any[]) {
	// 	console.log(args)
	// 	return args[args.length-1]
	// }

}
