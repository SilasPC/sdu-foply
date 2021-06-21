
/** Stamp format to easy interface with remote database */
export interface StampI {
	readonly unix: number
	readonly iso: string
}

export class Stamp implements StampI {

    static readonly ZERO = Stamp.fromUnix(0)

    /** Fixes timezone of postgresql timestamp */
    static fixTz(stamp: string) {
        const i = stamp.indexOf('+')
        if (i == -1)
            return stamp
        return stamp.slice(0, i)
    }

    static max(s1: StampI, s2: StampI): StampI {
        return s1.unix > s2.unix ? s1 : s2
    }

    static now() {
        const now = new Date()
        return new Stamp(
            toStamp(now),
            now.valueOf()
        )
    }

    static fromIso(stamp: string) {
        return new Stamp(
            this.fixTz(stamp),
            new Date(stamp).valueOf()
        )
    }

    static fromUnix(unix: number) {
        return new Stamp(
            toStamp(new Date(unix)),
            unix
        )
    }

    private constructor(
        public readonly iso: string,
        public readonly unix: number
    ) {}
    
}

/** Generates a postgresql timestamp from a Date object */
function toStamp(date: Date): string {
    const tzoffset = date.getTimezoneOffset() * 60000
    return (new Date(date.valueOf() - tzoffset)).toISOString().slice(0, -1)
}