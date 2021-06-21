
import { MessageI } from "../util/remoteDB";
import { Stamp, StampI } from "../util/Stamp";

const VALID_TAGS = new Set(['TXT','IMG','IMGURL','URL','LATLNG','USER'])
export type ValidTag = 'TXT' | 'IMG' | 'IMGURL' | 'URL' | 'LATLNG' | 'USER'

export type MsgPart = {
    type: ValidTag
    body: string
} | { type: '?' }

export interface MsgData {
	id: number
	outgoing: boolean
	body: string | MsgPart[]
	stamp: StampI
}

/** Supported tags: see type ValidTag */
export function parseMsg(selfUserId: string, msg: MessageI): MsgData {
    const ret: MsgData = {
        id: msg.id,
        outgoing: msg.sender == selfUserId,
        body: msg.body,
        stamp: Stamp.fromIso(msg.stamp)
    }

    // Test for potentially escaped text message
    if (!msg.body.startsWith('@'))
        return ret

    ret.body = ret.body.slice(1)
    if (msg.body.startsWith('@@'))
        return ret

    try {
        ret.body = JSON.parse(ret.body as string) as MsgPart[]
        
        // Check nobody tried something funny
        if (!Array.isArray(ret.body) || !ret.body[0]) {
            ret.body = [{type:'?'}]
            return ret
        }
        for (let part of ret.body)
            if (!VALID_TAGS.has(part.type))
                part.type = '?'

        return ret
    } catch {
        ret.body = [{type:'?'}]
        return ret
    }

}