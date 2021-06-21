import { Component, ViewChild } from '@angular/core';
import { IonContent, LoadingController, ModalController, NavParams, ToastController } from '@ionic/angular';
import { Chat } from 'src/app/models/Chat';
import { ImagePicker } from '@ionic-native/image-picker/ngx';
import { State } from 'src/app/models/State';
//! import { NativeGeocoder } from '@ionic-native/native-geocoder';
import { Cached } from 'src/app/util/async';
import { map } from 'rxjs/operators';

@Component({
	selector: 'app-msg-thread',
	templateUrl: './template.html',
	styleUrls: ['./style.sass'],
})
export class MsgThreadPage {

	@ViewChild(IonContent, { static: false })
	private content?: IonContent

	public showScrollToBottom = false

	private pollTimer: any
	public chat: Chat
	public msgToSend: string
	public hasOlder = true
	public isOnline: boolean

	public readonly offline$ = State.state$.pipe(map(s => !s.online))

	constructor(
		private modalCtrl: ModalController,
		private navParams: NavParams,
		private loadCtrl: LoadingController,
		private imagePicker: ImagePicker,
		//! private geoCoder: NativeGeocoder,
		private toastCtrl: ToastController
	) {
		this.createLoadingPopup()
		this.chat = navParams.get('chat')
		this.msgToSend = navParams.get('draft')
		this.chat.poll()
			.then(() => this.scrollToBottom())
		this.pollTimer = setInterval(() => {
			this.chat.poll()
		}, 5000)
		this.isOnline = State.getState().online
		// console.log(this)
	}

	async navBack() {
		(await this.modalCtrl.getTop()).dismiss()
	}

	async createLoadingPopup() {
		const loader = await this.loadCtrl.create()
		await loader.present()
		loader.dismiss()
	}

	ionViewDidEnter() {
		// can cause visual glitch
		this.content?.scrollToBottom()
	}

	scrollToBottom() {
		this.content?.scrollToBottom()
		this.showScrollToBottom = false
	}

	async didScroll() {
		this.showScrollToBottom = true
	}

	async pickImg() {
		try {
			const body = await this.imagePicker.getPictures({
				maximumImagesCount: 1,
				width: 500,
				height: 500,
				outputType: 1 // base64
			})
			await this.chat.send([{type:'IMG', body}])
			await this.content?.scrollToBottom()
		} catch (e) {
			if (e == 'cordova_not_available') {
				const toast = await this.toastCtrl.create({
					message: 'Feature not available on your device',
					duration: 500
				})
				await toast.present()
			}
		}
	}

	async sendMsg() {
		const msg = this.msgToSend.trim()
		this.msgToSend = ''
		if (msg)
			await this.chat.send(msg)
		// BUG: happens beftypeof msg.body == 'string'ore angular update:
		await this.content?.scrollToBottom()
	}

	//// private restore: (()=>void) | null = null
	async loadHistory(ev: any) {
		if (!this.hasOlder) return
		const el = await this.content?.getScrollElement()
		// await this.wait()
		this.hasOlder = await this.chat.pollHistory()
		if (el) {
			const old = el.scrollHeight - el.scrollTop
			const f = () => {
				el.scrollTop = el.scrollHeight - old
			}
			//// this.restore = f
			setTimeout(f, 0) // ! this works but it can cause visual glitch
		}
		ev.target.complete()
	}

	ngOnChanges() {
		////  if (this.restore)
		////    this.restore()
		////  this.restore = null
	}

	ngOnDestroy() {
		clearInterval(this.pollTimer)
	}

	wait() {
		return new Promise((res) => {
			setTimeout(res, 400)
		})
	}

	isString(x: any): x is string {
		return typeof x == 'string'
	}

	@Cached() // cache for multiple calls by Angular
	async revGeo(coords: string) {
		const [lat,lng] = coords.split(', ').map(Number)
		//! const res = await this.geoCoder.reverseGeocode(lat, lng)
		console.log(coords, 'DISABLED')
	}

}
