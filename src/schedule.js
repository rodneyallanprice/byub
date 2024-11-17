import { promises as fs } from 'fs';
import { monitorEventLoopDelay } from 'perf_hooks';

let schedule = {}

const witchingHour = 24 * 60

const getJson = async () => {
  try {
    return JSON.parse(await fs.readFile("rest_hours.json", "utf-8"))
  } catch (error) {
    console.log(`Failed to read file 'rest_hours.json'.`)
  }
}

const recognizedDayStrings = {
  monday: 'Mon',
  mon: 'Mon',
  mo: 'Mon',
  tuesday: 'Tue',
  tue: 'Tue',
  tu: 'Tue',
  wednesday: "Wed",
  wed: "Wed",
  we: "Wed",
  thursday: "Thu",
  thu: "Thu",
  th: "Thu",
  friday: "Fri",
  fri: "Fri",
  fr: "Fri",
  saturday: "Sat",
  sat: "Sat",
  sa: "Sat",
  sunday: "Sun",
  sun: "Sun",
  su: "Sun"
}

const daysOfTheWeek = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun'
]

const stripWhitespace = (str) => {
  return str.replaceAll(/\s/g, '')
}

export const nextDay = (day) => {
  if (day === 'Sun') {
    return 'Mon'
  }
  const todayIdx = daysOfTheWeek.findIndex(weekday => weekday == day)
  return daysOfTheWeek[todayIdx + 1]
}

export const expandDayRange = (dayRange) => {
  const dayArray = dayRange.split('-')
  if (dayArray.length == 1) {
    return dayArray
  }
  const last = dayArray.pop()
  const days = dayArray
  let currentDay = days[0]
  do {
    currentDay = nextDay(currentDay)
    days.push(currentDay)
  } while (currentDay != last)
  return days
}

export const parseDayRange = (daysStr) => {
  const dayRanges = stripWhitespace(daysStr).split(',')
  const days = []
  for (const dayRange of dayRanges) {
    days.push(...expandDayRange(dayRange))
  }
  return days
}

export const getOffsetFromTime = (timeStr, period) => {
  const timeParts = timeStr.split(':')
  let hours = parseInt(timeParts[0])
  let minutes = parseInt(timeParts[1]) || 0
  if (period.toLowerCase() === 'pm') {
    if(hours !== 12) {
      hours += 12
    }
  } else if (hours == 12) {
    hours -= 12
  }
  return hours * 60 + minutes
}

export const getTimeFromOffset = (offset) => {
  let hour = Math.floor(offset / 60)
  const minutes = offset % 60
  let period
  if(hour === 0) {
    hour = 12
    period = 'am'
  } else if(hour === 12) {
    period = 'pm'
  } else if(hour > 12) {
    period = 'pm'
    hour -= 12
  } else {
    period = 'am'
  }
  return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`
}

export const parseTime = (timeStr) => {
  const parts = timeStr.split(' ')
  return getOffsetFromTime(parts[0], parts[1])
}

export const parseTimeRange = (timeRange) => {
  const rangeParts = timeRange.split(' - ')
  if (rangeParts.length != 2) {
    throw new Error(`Unexpected time syntax: ${timeRange}`)
  }
  const startOffset = parseTime(rangeParts[0])
  const stopOffset = parseTime(rangeParts[1])

  const start = startOffset
  let stop
  let spillOver = 0
  if(stopOffset >= startOffset) {
    stop = stopOffset
  } else {
    stop = witchingHour
    if(stopOffset !== 0) {
      spillOver = stopOffset
    }
  }
  return { start, stop, spillOver }
}

export const insertSchedule = (masterSchedule, name, days, times) => {
  if(!masterSchedule[name]) {
    masterSchedule[name] = {}
  }
  const bizSchedule = masterSchedule[name]
  for (const day of days) {
    if (!bizSchedule[day]) {
      bizSchedule[day] = []
    }
    bizSchedule[day].push({
      open: times.start,
      closed: times.stop
    })
    if (times.spillOver) {
      const tomorrow = nextDay(day)
      if (!bizSchedule[tomorrow]) {
        bizSchedule[tomorrow] = []
      }
      bizSchedule[tomorrow].push({
        open: 0,
        closed: times.spillOver
      })
    }
  }
}

const splitDaysFromTimeRange = (schedule) => {
  const parts = schedule.split(' ')
  const dayParts = []

  while (Number.isNaN(Number(parts[0][0]))) {
    dayParts.push(parts.shift())
  }

  const dayRange = dayParts.join(' ')
  const timeRange = parts.join(' ')

  return {
    dayRange,
    timeRange
  }
}

export const buildMasterSchedule = async () => {
  const masterSchedule = {}
  const restaurants = await getJson()
  restaurants.forEach((restaurant) => {
    restaurant.times.forEach((schedule) => {
      const { dayRange, timeRange} = splitDaysFromTimeRange(schedule)
      const days = parseDayRange(dayRange)
      const openTimes = parseTimeRange(timeRange)
      insertSchedule(masterSchedule, restaurant.name, days, openTimes)
    })
  })
  return masterSchedule
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
  Object.entries(schedule).forEach(([restaurant, schedule]) => {
    let closes = undefined
    Object.entries(schedule).forEach(([scheduleDay, ranges]) => {
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
        closes: getTimeFromOffset(closes)
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
