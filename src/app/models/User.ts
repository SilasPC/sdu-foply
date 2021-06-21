
import { Query } from '../util/Query';
import { FollowsI, followUrl, UserI, userUrl } from '../util/remoteDB';
import { Stamp } from '../util/Stamp';
import { UserData } from './Storage';
import * as Storage from './Storage'

export class User implements UserData {

    public static fromUserI(u: UserI) {
        return new User(u.id, u.name, u.stamp, null, null)
    }

	private constructor(
        public readonly id: string,
        public name: string,
        public stamp: string,
        public lastLocalLogin: Stamp | null,
        public prevLocalLogin: Stamp | null
	) {}

    public static checkValidId(id: string) {
		// At least one, only alphanumerical and _
        return /^\w+$/.test(id)
    }
	public static checkValidName(name: string) {
		// At least one, only alphanumerical and ' ' (space)
		return /^[a-zA-Z0-9 ]+$/.test(name)
	}

	/** Finds a user by id. Queries local and remote, potentially updating local. */
	public static async byId(id: string): Promise<User | null> {
		
		if (!this.checkValidId(id)) return null
		
		// Query local
		let user = this.transformInto(await Storage.getUserData(id))

		try {
			const remoteUser = (await new Query<UserI>(userUrl)
				.where(['id','eq',id])
				.get())[0]
			
			if (!remoteUser) {
				// ? Should we support deletions?
				/* if (user) // Delete from local
					await Storage.setUserData(id, null)*/
				return null
			}
			
			user ??= this.fromUserI(remoteUser)
			Object.assign(user, remoteUser)
			await Storage.setUserData(id, user)
		} catch {
			// Failure, probably no internet, return local
			return Storage.getUserData(id)
				.then(x => User.transformInto(x))
		}
		return user
	}

	public static async tryCreate(id: string, name: string): Promise<User|null> {
		if (!this.checkValidId(id) || ! this.checkValidName(name))
			throw new Error(`Invalid id and/or name: id:'${id}', name:'${name}'`)
        let user = await this.byId(id)
        if (user)
			// Already exists (locally)
            return null
		
		try {
			const data = await new Query<UserI>(userUrl)
				.insert({id,name})
			// Success
			user = this.fromUserI(data)
			Storage.setUserData(id, user)
			return user
		} catch {
			// Remote error (probably already exists)
			return null
		}
    }

	/** Start following another user */
	public async startFollow(toFollow: User) {
        await new Query<FollowsI>(followUrl)
            .insert({
                follower: this.id,
                followee: toFollow.id,
            })
		const data1 = await Storage.getFollowData(toFollow.id) ?? { followed: [], followers: [] }
		const data2 = await Storage.getFollowData(this.id) ?? { followed: [], followers: [] }
		data1.followers.push(this.id)
		data2.followers.push(toFollow.id)
		await Storage.setFollowData(toFollow.id, data1)
		await Storage.setFollowData(this.id, data2)
    }

	/**
	 * Change name of user
	 * @returns success
	 */
	public async update(name: string): Promise<boolean> {
		if (!User.checkValidName(name))
			return false
		const now = Stamp.now()
		try {
			const stamp = now.iso
			const [remoteUser] = await new Query<UserI>(userUrl)
				.where(['id','eq',this.id])
				.where(['stamp','lt',stamp])
				.update({ name, stamp })
			if (!remoteUser)
				return false // concurrent update
			Object.assign(this, remoteUser)
			return true
		} catch {
			return false // failed to send
		}
	}

	public async getFollowData(): Promise<{followed: User[], followers: User[]} | null> {
		try {
			const followed = await Promise.all((await new Query<FollowsI>(followUrl)
				.where(['follower','eq',this.id])
				.join<UserI>('followee')
				.get())
				.map(({joined}) => User.updateAndTransform(joined)))
			const followers = await Promise.all((await new Query<FollowsI>(followUrl)
				.where(['followee','eq',this.id])
				.join<UserI>('follower')
				.get())
				.map(({joined}) => User.updateAndTransform(joined)))
			// console.log(followed,followers)
			return { followed, followers }
		} catch (e) {
			// Fallback to local data
			const data = await Storage.getFollowData(this.id)
			if (!data) return null
			const followed = (await Promise.all(
				data.followed.map(id => Storage.getUserData(id))))
				.map(u => User.transformInto(u))
				.filter(isNonNull)
			const followers = (await Promise.all(
				data.followers.map(id => Storage.getUserData(id))))
				.map(u => User.transformInto(u))
				.filter(isNonNull)
			return { followed, followers }
		}
	}

	public static async search(searchString: string): Promise<User[]|null> {
		try {
			const data = await new Query<UserI>(userUrl)
				.where(Query.any(
					['name','ilike',`*${searchString}*`],
					['id','ilike',`*${searchString}*`])
				)
				.get()
			return await Promise.all(data.map(u => this.updateAndTransform(u)))
		} catch {}
		return null
	}

	private static async updateAndTransform(u: UserI): Promise<User> {
		let data = await Storage.getUserData(u.id)
		if (data) {
			data.name = u.name
			data.stamp = u.stamp
			await Storage.setUserData(u.id, data)
		} else {
			data = {
				...u,
				// prevLocalLogin: null,
				// lastLocalLogin: null
			}
		}
		return this.transformInto(data)
	}

	/** Prototype hacking */
    private static transformInto<T extends UserI | null>(u: T): T extends UserI ? User : null {
        if (u) {
			const user = Object.setPrototypeOf(u, this.prototype) as User
			user.prevLocalLogin ??= null
			user.lastLocalLogin ??= null
		}
        return u as any
    }

	public static nameSorter(a: User, b: User) {
		return a.name.localeCompare(b.name)
	}

}

function isNonNull<T>(t?: T|null): t is T {return !!t} 
