import { findOpenTables, humanizeTime, normalizeTimeString } from "./src/schedule.js";

const test = (time, period) => {
    const minute = normalizeTimeString(time, period)
    const timeStr = humanizeTime(minute)
    console.log(`${time} ${period} => ${timeStr}`)
}


console.log('hello')
findOpenTables('sat', '12:00 am').then((restaurants) => {
    console.log(restaurants)
})

