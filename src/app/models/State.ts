import { User } from '../models/User';
import * as Storage from '../models/Storage';
import { PING } from '../util/http';
import { baseUrl } from '../util/remoteDB';
import { BehaviorSubject } from 'rxjs';

export interface StateData {
	readonly user: User | null
	readonly online: boolean
}
const getDefault: () => StateData =
	() => ({user:null,online:true})

/**
 * Provides state across the app, such as login data
 */
export class State {

	private static storedState: Promise<Storage.StoredState>
	
	private static readonly _state$ = new BehaviorSubject<StateData>(getDefault())
	private static state = getDefault()
	public static readonly state$ = State._state$.asObservable()

    public static readonly ready = State.init()
	private static async init() {
		const online = true //await PING(baseUrl)
        await Storage.ready()
		this.storedState = Storage.getStoredState()
			.then(s => s ?? {login: null})
		const storedState = await this.storedState
		if (storedState.login) {
			const user = await User.byId(storedState.login)
			const state = this.getState()
			if (user && !state.user)
				await State.signIn(user)
		}
	}

	public static getState(): StateData {
		return this.state
	}

	public static reset() {
		this._state$.next(this.state = getDefault())
	}

	public static async signIn(user: User) {
		const newState = {
			...this.getState(),
			user
		}
		const state = await this.storedState
		// await Storage.updateLastLogin(user)
		state.login = user.id
		await Storage.setStoredState(state)
		this._state$.next(this.state = newState)
	}

	public static async signOut() {
		await Storage.setStoredState()
		this._state$.next(this.state = {
			...this.getState(),
			user: null
		})
	}

}
