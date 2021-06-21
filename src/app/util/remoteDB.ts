
/** Bearer authorization token */
export const BEARER_TOKEN =
`XYZ`

export const baseUrl = 'http://caracal.imada.sdu.dk/app2021'
export const userUrl    = baseUrl + '/users'
export const followUrl  = baseUrl + '/follows'
export const msgUrl     = baseUrl + '/messages'

/** Scheme for table `messages` */
export interface MessageI {
    id: number;
    sender: string;
    receiver: string;
    body: string;
    stamp: string;
}

/** Scheme for table `users` */
export interface UserI {
    id: string;
    name: string;
    stamp: string;
}

/** Scheme for table `follows` */
export interface FollowsI {
    follower: string;
    followee: string;
    stamp: string;
}