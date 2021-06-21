
import { POST, GET, DELETE, PATCH } from "./http"

export function escapeSql(str: any): string {
    return String
        .prototype.toString.call(str)
        .replace(/[&;,\\]/g, c => '\\'+c)
}

type Op = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'like' | 'ilike'
type Condition<T, K extends keyof T = keyof T> = [K, Op, T[K]] | [K, 'in', Array<T[K]>] | [K, 'is', T[K] extends boolean ? (boolean|null) : null]
type CompoundCondition<T> = {cond:'or'|'and',comp:string}
export class Query<T extends Object> {

    constructor(
        private url: string
    ) {this.url += '?'}

    /**
     * Creates a compound condition where at least one condition must be satisfied
     */
    public static any<T>(...args: Array<CompoundCondition<T>|Condition<T>>): CompoundCondition<T> {
        let comp = '('
        for (let arg of args)
            comp += this.parseCond(arg) + ','
        comp = comp.slice(0,-1) + ')'
        return {cond:'or',comp}
    }
    /**
     * Creates a compound condition where all conditions must be satisfied
     */
    public static all<T>(...args: Array<CompoundCondition<T>|Condition<T>>): CompoundCondition<T> {
        let comp = '('
        for (let arg of args)
            comp += this.parseCond(arg) + ','
        comp = comp.slice(0,-1) + ')'
        return {cond:'and',comp}
    }
    private static parseCond<T>(c: CompoundCondition<T>|Condition<T>): string {
        if ('cond' in c)
            return c.cond+c.comp
        if (c[1] == 'in')
            return `${c[0]}.in.(${c[2].map(escapeSql).join(',')})`
        else
            return `${c[0]}.${c[1]}.${c[2]}`
    }

    /**
     * Filters rows based on one or more conditions or compound conditions that
     *   all must be satisfied.
     * 
     * Example usage:
     * ```javascript
     * new Query<User[]>(someUrl)
     *  .where(['id','eq',123],['name','in',['foo','bar']])
     *  .where(Query.or(['id','eq',321],['name','in',['lorem', 'ipsum']]))
     *  .get()
     * ```
     */
    where(...args: Array<Condition<T>|CompoundCondition<T>>): this {
        for (let cond of args) {
            if (Array.isArray(cond)) {
                // element is Condition<E>
                if (cond[1] == 'in')
                    this.url += `${cond[0]}=in.(${cond[2].map(escapeSql).join(',')})&`
                else if (typeof cond[1] == 'string')
                    this.url += `${cond[0]}=${cond[1]}.${escapeSql(cond[2])}&`
            } else {
                // element is CompoundCondition<E>
                this.url += cond.cond + '=' + cond.comp + '&'
            }
        }
        return this
    }

    offset(n: number): this {
        this.url += `offset=${n}&`
        return this
    }
    limit(n: number): this {
        this.url += `limit=${n}&`
        return this
    }
    limitIf(doLimit: boolean, n: number): this {
        if (doLimit)
            this.url += `limit=${n}&`
        return this
    }

    order<K extends keyof T>(key: K, order: 'asc' | 'desc' = 'asc'): this {
        this.url += `order=${key}.${order}&`
        return this
    }

    debug(): this {
        console.log(`Query { ${this.url} }`)
        return this
    }

    /**
     * @returns a new Query instance
     */
    join<Scheme>(on: keyof T): Query<T & {joined: Scheme}> {
        const q = new Query<any>('')
        q.url = this.url + `select=*,joined:${escapeSql(on)}(*)&`
        return q
    }

    join2<Scheme, K extends keyof T, J extends string>(on: K, to: J): Query<T & Record<J, Scheme>> {
        const q = new Query<any>('')
        q.url = this.url + `select=*,${to}:${escapeSql(on)}(*)&`
        return q
    }

    async * orderedStream<K extends keyof T>(
        key: K,
        initialValue: T[K],
        order: 'asc' | 'desc' = 'asc'
    ): AsyncGenerator<T[]> {
        const url = this.url + `order=${key}.${order}`
        const op = order == 'asc' ? 'gt' : 'lt'
        let res: T[]
        let lastValue = initialValue
        do {
            res = await GET<T[]>(url+`&${key}.${op}=${escapeSql(lastValue)}`)
            const last = res[res.length-1]
            if (last)
                lastValue = last[key]
            yield res
        } while (res.length)
    }

    async insert(data: Partial<T>) {
        return (await POST<Partial<T>, T[]>(this.url, data))[0]
    }
    update(data: Partial<T>) {
        return PATCH<Partial<T>, T[]>(this.url, data)
    }
    get() {
        return GET<T[]>(this.url)
    }
    delete() {
        return DELETE<T[]>(this.url)
    }

    copy(): Query<T> {
        const q = new Query<T>('')
        q.url = this.url
        return q
    }

}
