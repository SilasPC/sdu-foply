
// This module exports basic async http requests
// All requests are authorized with the bearer token

import { BEARER_TOKEN } from "./remoteDB"

const headers = {
    Authorization: `Bearer ${BEARER_TOKEN}`,
    Prefer: 'return=representation',
    'Content-Type': 'application/json',
    Accept: 'application/json'
}

/** @returns true if server responded with any status code */
export function PING(url: string): Promise<boolean> {
    return fetch(url, { method: 'HEAD' })
        .then(r => r.status > 0, () => false)
}

export async function GET<T>(url: string): Promise<T> {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`'${url}' GET: ${res.status} ${res.statusText}`)
    return res.json()
}

export async function POST<T,R>(url: string, value: Partial<T>): Promise<R> {
    const res = await fetch(url, {
        headers,
        method: 'POST',
        body: JSON.stringify(value)
    })
    if (!res.ok) throw new Error(`'${url}' POST: ${res.status} ${res.statusText}`)
    return res.json()
}

export async function PATCH<T,R>(url: string, value: Partial<T>): Promise<R> {
    const res = await fetch(url, {
        headers,
        method: 'PATCH',
        body: JSON.stringify(value)
    })
    if (!res.ok) throw new Error(`'${url}' PATCH: ${res.status} ${res.statusText}`)
    return res.json()
}

export async function DELETE<R>(url: string): Promise<R> {
    const res = await fetch(url, {
        headers,
        method: 'DELETE'
    })
    if (!res.ok) throw new Error(`'${url}' DELETE: ${res.status} ${res.statusText}`)
    return res.json()
}