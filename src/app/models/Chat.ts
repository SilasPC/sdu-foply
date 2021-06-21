import { MessageI, msgUrl } from "../util/remoteDB"
import { Atomic } from '../util/async'
import { Query } from "../util/Query"
import { Stamp } from "../util/Stamp"
import { MsgData, MsgPart, parseMsg } from "./Msg"
import { User } from "./User"
import { ChatManager, ChatWithUser } from "./ChatManager"
import { BehaviorSubject, Observable } from "rxjs"

/** Represents a chat between two participants */
export class Chat {

    /** Number of messages to fetch at a time */
    private static readonly CHUNK_SIZE = 30

    /** Loaded messages */
    private msgs: MsgData[] = []
    private readonly _msgs$: BehaviorSubject<MsgData[]>
    public readonly msgs$: Observable<MsgData[]>

    private lastSyncTime = Stamp.ZERO
    private lastSyncIndex = -1

    /** Query for messages between the participants */
    private msgQuery: Query<MessageI>

    public constructor(
        private readonly chatManager: ChatManager,
        public readonly sender: User,
        public readonly receiver: User,
        public readonly chat: ChatWithUser = {user:receiver,data:{
            cachedMessages: [],
            unread: false,
            lastMessage: null,
            draft: ''
        }}
    ) {
        // Create reusable query
        this.msgQuery = new Query<MessageI>(msgUrl)
            .where(Query.any(
                Query.all(
                    ['receiver','eq',this.receiver.id],
                    ['sender','eq',this.sender.id]
                ),
                Query.all(
                    ['receiver','eq',this.sender.id],
                    ['sender','eq',this.receiver.id]
                )
            ))
        
        // Setup data
        this.msgs = [...chat.data.cachedMessages]
        this._msgs$ = new BehaviorSubject<MsgData[]>(this.msgs)
        this.msgs$ = this._msgs$.asObservable()

        // Initial poll
        this.poll(true).catch(console.error)
    }

    /** @returns true when there may be more messages to load */
    @Atomic()
    async pollHistory(): Promise<boolean> {

        // If there is no first message, there can't be a history
        if (!this.msgs[0])
            return false
        
        // Fetch some messages
        const stamp = Stamp.fixTz(this.msgs[0].stamp.iso)
        const oldMsgs = (await this.msgQuery
            .copy()
            .where(['stamp','lt',stamp])
            .limit(Chat.CHUNK_SIZE)
            .order('stamp','desc')
            .get())
            .reverse()
            .map(m => parseMsg(this.sender.id, m))
        // console.log(oldMsgs)
        
        // Prepend
        this.msgs.unshift(...oldMsgs)
        this._msgs$.next(this.msgs)
        this.lastSyncIndex += oldMsgs.length

        // There may be more messages if we got as many as we requested
        return oldMsgs.length == Chat.CHUNK_SIZE
    }
    
    /** Poll for new messages */
    @Atomic()
    public async poll(reset = false) {

        if (reset) // Clear this.msgs
            //? is this detected by Angular before completion?
            this.msgs = []

        // Fetch newer messages
        const newMsgs = (await this.msgQuery
            .copy()
            .where(['stamp','gt',this.lastSyncTime.iso])
            .limitIf(reset, Chat.CHUNK_SIZE)
            .order('stamp','desc')
            .get())
            .reverse()
            .map(m =>parseMsg(this.sender.id, m))

        const latestMsg = newMsgs[newMsgs.length-1]
        if (latestMsg) {
            this.lastSyncTime = latestMsg.stamp
            this.chat.data.lastMessage = latestMsg
        }

        // May have to remove some sent messages (they should be included in newMsgs as well)
        const toRemove = this.msgs.length - 1 - this.lastSyncIndex
        if (this.lastSyncIndex >= 0)
            this.msgs.splice(this.lastSyncIndex+1, toRemove, ...newMsgs) // Remove and append
        else
            this.msgs.push(...newMsgs)
        this._msgs$.next(this.msgs)

        this.lastSyncIndex = this.msgs.length - 1

        await this.chatManager.updateAndSave(this.chat)
    }

    /** Send a message with the given type or a regular text message */
    public async send(body: string | MsgPart[]) {

        if (typeof body == 'string' && body.charAt(0) == '@')
            body = '@' + body // Escape @ in normal msg
        
        // Upload
        const { id, stamp } = await new Query<MessageI>(msgUrl)
            .insert({
                sender: this.sender.id,
                receiver: this.receiver.id,
                body: typeof body == 'string' ? body : JSON.stringify(body)
            })
        
        // Local msg data format
        const data: MsgData = {
            id,
            body,
            outgoing: true,
            stamp: Stamp.fromIso(stamp)
        }
        this.msgs.push(data)
        this._msgs$.next(this.msgs)
        
        this.chat.data.lastMessage = data

        await this.chatManager.updateAndSave(this.chat)
    }

    public async setDraft(draft: string) {
        this.chat.data.draft = draft
        await this.chatManager.updateAndSave(this.chat)
    }

}
