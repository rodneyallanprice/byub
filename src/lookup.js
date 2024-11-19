import { buildMasterSchedule, getOffsetFromTime, getTimeFromOffset, nextDay } from './schedule.js'

let schedule = {}

const recognizedDayStrings = {
  monday: 'Mon',
  mon: 'Mon',
  mo: 'Mon',
  tuesday: 'Tue',
  tue: 'Tue',
  tu: 'Tue',
  wednesday: 'Wed',
  wed: 'Wed',
  we: 'Wed',
  thursday: 'Thu',
  thu: 'Thu',
  th: 'Thu',
  friday: 'Fri',
  fri: 'Fri',
  fr: 'Fri',
  saturday: 'Sat',
  sat: 'Sat',
  sa: 'Sat',
  sunday: 'Sun',
  sun: 'Sun',
  su: 'Sun',
}

const validateTime = (timestr) => {
  const res = /\b((1[0-2]|0?[1-9]):([0-5][0-9])([AaPp][Mm]))/.test(timestr)
  if (!res) {
    throw new Error('Invalid time')
  }
}

const parseRequestTime = (timeStr) => {
  const stripped = timeStr.replaceAll(/\s/g, '')
  validateTime(stripped)
  const period = stripped.slice(-2).toLowerCase()
  const time = stripped.slice(0, stripped.length - 2)
  return getOffsetFromTime(time, period)
}

const parseRequestDay = (dayStr) => {
  const stripped = dayStr.replaceAll(/\s/g, '').toLowerCase()
  const day = recognizedDayStrings[stripped]
  if (!day) {
    throw new Error('Unrecognized day')
  }
  return day
}

const closingAM = (restaurant, day) => {
  const tomorrow = nextDay(day)
  const ranges = schedule[restaurant][tomorrow]
  let closes = -1
  if (ranges) {
    ranges.forEach((range) => {
      if (range.open === 0) {
        closes = range.closed
      }
    })
  }
  return closes
}

const getOpenTables = (day, minute) => {
  const openRestaurants = []
  Object.entries(schedule).forEach(([restaurant, openTimes]) => {
    let closes
    Object.entries(openTimes).forEach(([scheduleDay, ranges]) => {
      if (scheduleDay === day) {
        ranges.forEach((range) => {
          if (minute >= range.open && minute < range.closed) {
            closes = range.closed
          }
        })
      }
    })
    if (closes) {
      if (closes === 1440) {
        const amClose = closingAM(restaurant, day)
        if (amClose > 0) {
          closes = amClose
        } else {
          closes = 0
        }
      }
      openRestaurants.push({
        name: restaurant,
        closes: getTimeFromOffset(closes),
      })
    }
  })
  return openRestaurants
}

export const findOpenTables = async (dayStr, time) => {
  if (Object.keys(schedule).length === 0) {
    schedule = await buildMasterSchedule()
  }
  const day = parseRequestDay(dayStr)
  const minute = parseRequestTime(time)

  const list = getOpenTables(day, minute)
  return list
}
