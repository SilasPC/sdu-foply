
const sec = 1000
const min = 60*sec
const hour = 60*min
const day = 24*hour
const week = 7*day
const month = 30*day
const year = 365*day
/** Returns a human readable time difference given a number of milliseconds */
export function prettyTimeDifference(dif: number) {
    const suffix = dif >= 0 ? ' ago' : ''
    const prefix = dif >= 0 ? '' : 'in '
    dif = Math.abs(dif)
    const mins = Math.round(dif/min)
    const hours = Math.round(dif/hour)
    const days = Math.round(dif/day)
    const weeks = Math.floor(dif/week)
    const months = Math.floor(dif/month)
    const years = Math.floor(dif/year)
    let str: string
    let num: number
    if (dif < 20*sec) return 'now'
    if (years) {
        str = 'year'
        num = years
    } else if (months) {
        str = 'month'
        num = months
    } else if (weeks) {
        str = 'week'
        num = weeks
    } else if (days) {
        str = 'day'
        num = days
    } else if (hours) {
        str = 'hour'
        num = hours
    } else if (mins) {
        str = 'minute'
        num = mins
    } else
        return prefix + 'less than a minute' + suffix
    return prefix + num + ' ' + str + (num > 1 ? 's' : '') + suffix
}
