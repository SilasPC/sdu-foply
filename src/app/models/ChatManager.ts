import { Atomic, HoldsAsyncLock } from "../util/async";
import { Query } from "../util/Query";
import { MessageI, msgUrl } from "../util/remoteDB";
import { Stamp, StampI } from "../util/Stamp";
import { parseMsg } from "./Msg";
import { ChatData } from "./Storage";
import { User } from "./User";
import * as Storage from './Storage'
import { Chat } from "./Chat";
import { BehaviorSubject, Observable } from "rxjs";

export interface ChatManagerMeta {
    userId: string
    knownChats: string[]
    lastSync: StampI
}

export interface ChatWithUser {
    user: User
    data: ChatData
}

export class ChatManager {

    public static async forUser(user: User) {
        const meta: ChatManagerMeta = await Storage.getChatManagerMeta(user.id) ?? {
            knownChats: [],
            lastSync: Stamp.ZERO,
            userId: user.id
        }
        const chatData = await Promise.all(meta.knownChats.map( async id => {
            const data = await Storage.getChatData(user.id, id)
            if (!data) return null
            const recipient = await User.byId(id)
            if (!recipient) return null
            const chat: ChatWithUser = {user: recipient,data}
            return chat
        }))
        return new ChatManager(meta, user, chatData.filter(isNotNull))
    }

    private readonly _data$: BehaviorSubject<ReadonlyArray<ChatWithUser>>
    public readonly data$: Observable<ReadonlyArray<ChatWithUser>>
    private lookup: Map<string, ChatWithUser> = new Map()
    
    private constructor(
        private meta: ChatManagerMeta,
        public readonly sender: User,
        private msgData: ChatWithUser[]
    ) {
        msgData.sort(compareLastMsgTime)
        for (let chat of msgData)
            this.lookup.set(chat.user.id, chat)
        this._data$ = new BehaviorSubject<ReadonlyArray<ChatWithUser>>(msgData)
        this.data$ = this._data$.asObservable()
    }

    public hasChatWith(id: string): boolean {
        return this.lookup.has(id)
    }

    public getMsgData(): ReadonlyArray<ChatWithUser> {
        return this.msgData
    }

    async markThreadUnread(chat: ChatWithUser, unread = true) {
        chat.data.unread = unread
        await Storage.setChatData(this.sender.id, chat.user.id, chat.data)
        //// numUnread += unread ? 1 : -1
        this._data$.next(this.msgData)
    }

    public async updateAndSave(chat: ChatWithUser) {
        // Add chat if it is new
        if (!this.lookup.has(chat.user.id) && chat.data.lastMessage) {
            this.lookup.set(chat.user.id, chat)
            this.msgData.push(chat)
        }
        this.msgData.sort(compareLastMsgTime)
        await Storage.setChatData(this.sender.id, chat.user.id, chat.data)
        this._data$.next(this.msgData)
    }

    @Atomic()
    @HoldsAsyncLock()
    public async sync() {
        console.log('syncing...')
        const now = Stamp.now()

        const newMsgs = await new Query<MessageI>(msgUrl)
            .where(Query.any(
                ['receiver','eq',this.sender.id],
                ['sender','eq',this.sender.id]
            ))
            .where(
                ['stamp','gt', this.meta.lastSync.iso],
                ['stamp','lte', now.iso]
            )
            .order('stamp')
            .get()

        if (!newMsgs.length) {
            console.log('no sync')
            return
        }
            
        let numUnread = 0 // TODO ?
        const newChats: Map<string, [Promise<User|null>, ChatData]> = new Map()
        const updatedChats = new Set<ChatWithUser>()

        for (let msg of newMsgs) {
            const msgData = parseMsg(this.sender.id, msg)
            const otherUserId = msg.sender == this.sender.id
                ? msg.receiver
                : msg.sender

            const chat = this.lookup.get(otherUserId)
                
            if (chat) {
                if (updatedChats.has(chat)) {
                    chat.data.cachedMessages.push(msgData)
                } else {
                    chat.data.cachedMessages = [msgData] // TODO alternative?
                    updatedChats.add(chat)
                }
                if (!chat.data.unread && !msgData.outgoing)
                    numUnread++
                chat.data.unread ||= !msgData.outgoing
                chat.data.lastMessage = msgData
            } else {
                const newChat = newChats.get(otherUserId)
                if (newChat) {
                    newChat[1].unread ||= !msgData.outgoing
                    newChat[1].cachedMessages.push(msgData)
                    newChat[1].lastMessage = msgData
                } else {
                    const userP = User.byId(otherUserId).catch(()=>null)
                    const data = {
                        unread: !msgData.outgoing,
                        cachedMessages: [msgData],
                        lastMessage: msgData,
                        draft: ''
                    }
                    newChats.set(otherUserId, [userP, data])
                }
            }
        }
        
        for (let [userP,data] of newChats.values()) {
            const user = await userP
            if (!user) continue //! DELETED USER?
            this.meta.knownChats.push(user.id)
            const chat: ChatWithUser = { user, data }
            if (chat.data.unread)
                numUnread++
            this.lookup.set(user.id, chat)
            this.msgData.push(chat)
        }

        await Promise.all([
            ...[...updatedChats].map(c => Storage.setChatData(this.sender.id, c.user.id, c.data)),
            ...[...newChats].map(([id,[,c]]) => Storage.setChatData(this.sender.id, id, c))
        ])

        this.msgData.sort(compareLastMsgTime)
        this.meta.lastSync = now
        await Storage.setChatManagerMeta(this.sender.id, this.meta)

        this._data$.next(this.msgData)
        console.log('synced')
    }

}

function isNotNull<T>(t:T|null): t is T {
    return t !== null
}

const someTimeInTheFuture = 2 * Date.now()
function compareLastMsgTime(a: ChatWithUser, b: ChatWithUser): number {
    return (b.data.lastMessage?.stamp?.unix ?? someTimeInTheFuture) - (a.data.lastMessage?.stamp?.unix ?? someTimeInTheFuture)
}