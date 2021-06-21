import { Storage } from '@ionic/storage'
import { UserI, userUrl } from '../util/remoteDB';
import { Stamp, StampI } from '../util/Stamp';
import { Query } from '../util/Query';
import { ChatManagerMeta } from './ChatManager';
import { MsgData } from './Msg';

const store = new Storage()
const storeReady = store.create()

export function ready(): Promise<void> {
    return storeReady as Promise<any>
}

export function getStoredState(): Promise<StoredState | null> {
    return store.get(`state`)
}

export function setStoredState(state: StoredState|null = null): Promise<void> {
    if (!state)
        return store.remove('state')
    return store.set(`state`, state)
}

export function getUserData(id: string): Promise<UserData | null> {
    return store.get(`user/${id}`)
}
export function setUserData(id: string, data: UserData|null = null): Promise<void> {
    const key = `user/${id}`
    if (!data)
        return store.remove(key)
    return store.set(key, data)
}

export function setFollowData(id: string, followers: FollowData|null = null): Promise<void> {
    const key = `follow/${id}`
    if (!followers)
        return store.remove(key)
    return store.set(key, followers)
}
export function getFollowData(id: string): Promise<FollowData | null> {
    return store.get(`follow/${id}`)
}

export function getChatData(from: string, to: string): Promise<ChatData | null> {
    return store.get(`chat-data/${from}/${to}`)
}
export function setChatData(from: string, to: string, data: ChatData): Promise<void> {
    return store.set(`chat-data/${from}/${to}`, data)
}

export function setChatManagerMeta(userId: string, meta: ChatManagerMeta|null): Promise<void> {
    const key = `chat-manager/${userId}`
    if (!meta)
        return store.remove(key)
    return store.set(key, meta)
}
export function getChatManagerMeta(userId: string): Promise<ChatManagerMeta|null> {
    return store.get(`chat-manager/${userId}`)
}

export async function reset() {
    await store.clear()
}

export interface StoredState {
	login: string | null
}

export type UserData = UserI

export interface FollowData {
	followers: string[]
	followed: string[]
}

export interface ChatData {
    cachedMessages: MsgData[]
    lastMessage: MsgData|null
    draft: string
    unread: boolean
}
