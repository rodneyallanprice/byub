import { witchingHour, buildMasterSchedule, getOffsetFromTime, getTimeFromOffset, nextDay } from './schedule.js'

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

export const validateTimeString = (timestr) => {
  const res = /\b((1[0-2]|0?[1-9]):([0-5][0-9]) ([AaPp][Mm]))/.test(timestr)
  if (!res) {
    throw new Error('Invalid time')
  }
}

export const parseRequestTime = (timeStr) => {
  const stripped = timeStr.replaceAll(/\s/g, '')
  const period = stripped.slice(-2).toLowerCase()
  const time = stripped.slice(0, stripped.length - 2)
  let formaltime
  if (time.split(':').length === 1) {
    formaltime = `${time}:00`
  } else {
    formaltime = time
  }

  validateTimeString(`${formaltime} ${period}`)

  return getOffsetFromTime(formaltime, period)
}

export const parseRequestDay = (dayStr) => {
  const stripped = dayStr.replaceAll(/\s/g, '').toLowerCase()
  const day = recognizedDayStrings[stripped]
  if (!day) {
    throw new Error('unrecognized day')
  }
  return day
}

export const calculateAmClosingTime = (restaurant, today) => {
  const tomorrow = nextDay(today)
  const ranges = schedule[restaurant][tomorrow]
  let closes = 0
  if (ranges) {
    ranges.forEach((range) => {
      if (range.open === 0) {
        closes = range.closed
      }
    })
  }
  return closes
}

export const calculateClosingTime = (restaurant, day, closes) => {
  if (closes === witchingHour) {
    return calculateAmClosingTime(restaurant, day)
  }
  return closes
}

export const getOpenTables = (day, minute) => {
  const openRestaurants = []
  Object.entries(schedule).forEach(([restaurant, openTimes]) => {
    let openUntil
    Object.entries(openTimes).forEach(([scheduleDay, ranges]) => {
      if (scheduleDay === day) {
        ranges.forEach((range) => {
          if (minute >= range.open && minute < range.closed) {
            openUntil = range.closed
          }
        })
      }
    })
    if (openUntil) {
      const closes = calculateClosingTime(restaurant, day, openUntil)
      openRestaurants.push({
        name: restaurant,
        closes: getTimeFromOffset(closes),
      })
    }
  })
  return openRestaurants
}

export const findOpenTables = (dayStr, time) => {
  if (Object.keys(schedule).length === 0) {
    throw new Error('call init to load the schedule')
  }
  const day = parseRequestDay(dayStr)
  const minute = parseRequestTime(time)

  const list = getOpenTables(day, minute)
  return list
}

export const init = async () => {
  schedule = await buildMasterSchedule()
}

export const lookupRequest = ({ day, time }) => {
  return findOpenTables(day, time)
}
