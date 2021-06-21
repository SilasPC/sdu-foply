
type PromiseFunc = (...args:any[]) => Promise<any>

/**
 * Method decorator that wraps an async function,
 *  such that multiple concurrent calls before
 *  the method fullfills/rejects, results in the Promise
 *  of the first call.
 */
 export function Atomic() {
    return function atomicDecorator(
        _proto:any,
        _key:any,
        desc: TypedPropertyDescriptor<PromiseFunc>
    ) {
        const func = desc.value as any
        let promise: Promise<any> | null = null
        // Overwrite method
        desc.value = function atomicallyDecorated(this: any, ...args:any[]) {
            return promise ??= func.call(this, ...args)
                .then((retVal: any) => (retVal))
                .finally(()=> promise = null )
        } as any
    }
}

/**
 * Class for doing sequential locking of asyncronous functions
 * 
 * Usage:
 * ```typescript
 * const lock = new AsyncLock()
 * const {unlock} = await lock // wait for lock
 * // ... async body
 * unlock() // must only be called once
 * ```
 * 
 * Beware of uncaught exceptions leading to a perma-locked queue
 */
export class AsyncLock {

    private queue: Function[] = []
    private unlock = {
        unlock: () => this.unqueue()
    }

    public isHeld() {
        return this.queue.length > 0
    }

    /** Callback is called when lock is acquired, can be used as `Thenable` */
    public then(f: (x:{unlock():void})=>any) {
        this.queue.push(f)
        if (this.queue.length == 1)
            f(this.unlock)
    }

    private unqueue() {
        this.queue.shift()
        if (this.queue.length)
            // non blocking invocation:
            setTimeout(()=>this.queue[0](this.unlock), 0)
    }

}

/** Symbol for attributing AsyncLock to a `this` object (see below). */
const LOCK_SYMBOL = Symbol('AsyncLock')
/**
 * Wraps async method and associates an AsyncLock to `this` object or uses `lock`.
 * Underlying function executes with the lock held,
 *   which is released on fullfillment or rejection of the returned Promise.
 */
export function HoldsAsyncLock(asyncLock?: AsyncLock) {
    return function lockDecorator(
        _proto: any,
        _key: any,
        desc: TypedPropertyDescriptor<PromiseFunc>
    ) {
        const func = desc.value as PromiseFunc
        // Overwrite method
        desc.value = async function lockDecorated(this: any, ...args:any[]) {
            const lock = asyncLock ?? (this[LOCK_SYMBOL] ??= new AsyncLock())
            const {unlock} = await lock
            try {
                return func.call(this,...args)
            }
            catch (e) {
                throw e
            }
            finally {
                unlock()
            }
        }
    }
}

type Func = (arg: any, ...args:any[]) => any
/** Caches return value of function on the first argument */
export function Cached() {
    const cache = new Map()
    return function lockDecorator(
        _proto: any,
        _key: any,
        desc: TypedPropertyDescriptor<Func>
    ) {
        const func = desc.value as (...args: any[]) => any
        // Overwrite method
        desc.value = function cacheDecorated(this: any, ...args: any[]) {
            if (cache.has(args[0]))
                return cache.get(args[0])
            else {
                const ret = func.call(this, ...args)
                cache.set(args[0], ret)
                return ret
            }
        }
    }
}
