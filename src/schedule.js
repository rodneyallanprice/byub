import { promises as fs } from 'fs';
import { monitorEventLoopDelay } from 'perf_hooks';

let schedule = {}

const getJson = async () => {
  try {
    return JSON.parse(await fs.readFile("rest_hours.json", "utf-8"))
  } catch (error) {
    console.log('Failed to read file.')
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

export const nextDay = (day) => {
  if (day === 'Sun') {
    return 'Mon'
  }
  const todayIdx = daysOfTheWeek.findIndex(weekday => weekday == day)
  return daysOfTheWeek[todayIdx + 1]
}

const expandDayRange = (dayRange) => {
  if (dayRange.length == 1) {
    return dayRange
  }
  const last = dayRange.pop()
  const days = dayRange
  let idx = daysOfTheWeek.findIndex((day) => day == days[0])

  do {
    idx++
    days.push(daysOfTheWeek[idx])
  }
  while (daysOfTheWeek[idx] != last)
  return days
}

const parseDays = (dayStr) => {
  const dayRanges = dayStr.split(',')
  const days = []
  for (const dayRange of dayRanges) {
    days.push(...expandDayRange(dayRange.split('-')))
  }
  return days
}

export const normalizeTimeString = (timeStr, suffix) => {
  const timeParts = timeStr.split(':')
  let hours = parseInt(timeParts[0])
  if (suffix == 'pm') {
    hours += 12
  } else if (hours == 12) {
    hours -= 12
  }
  let minutes = parseInt(timeParts[1]) || 0
  return hours * 60 + minutes
}

export const humanizeTime = (minute) => {
  let hour = Math.floor(minute / 60)
  const minutes = minute % 60
  let period
  if (hour > 12) {
    period = 'pm'
    hour -= 12
  } else {
    period = 'am'
  }
  if (hour === 0) {
    hour = 12
  }
  return `${hour}:${minutes.toString().padStart(2, '0')} ${period}`
}

const parseTimeRange = (timeStr) => {
  // if (timeStr == '11 am - 12:30 am') {
  //     console.log('stop here')
  // }
  const rangeParts = timeStr.split(' - ')
  if (rangeParts.length != 2) {
    throw new Error(`Unexpected time syntax: ${timeStr}`)
  }
  const startParts = rangeParts[0].split(' ')
  const start = normalizeTimeString(startParts[0], startParts[1])
  const stopParts = rangeParts[1].split(' ')
  let stop
  let spillOver
  if (stopParts[1] == 'am') {
    stop = normalizeTimeString('12', 'pm')
    spillOver = normalizeTimeString(stopParts[0], stopParts[1])
  } else {
    stop = normalizeTimeString(stopParts[0], stopParts[1])
    spillOver = 0
  }

  return { start, stop, spillOver }
}

const updateIndex = (index, name, days, times) => {
  const schedule = index[name]
  for (const day of days) {
    if (!schedule[day]) {
      schedule[day] = []
    }
    schedule[day].push({
      open: times.start,
      closed: times.stop
    })
    if (times.spillOver) {
      const tomorrow = nextDay(day)
      if (!schedule[tomorrow]) {
        schedule[tomorrow] = []
      }
      schedule[tomorrow].push({
        open: 0,
        closed: times.spillOver
      })
    }
  }
}

const buildIndex = async () => {
  const index = {}
  const restaurants = await getJson()
  restaurants.forEach((restaurant) => {
    index[restaurant.name] = {}
    // console.log(`------ ${restaurant.name} ------`)
    restaurant.times.forEach((schedule) => {
      const parts = schedule.split(' ')
      const dayParts = []
      while (isNaN(parts[0][0])) {
        dayParts.push(parts.shift())
      }
      const days = parseDays(dayParts.join(''))

      const openTimes = parseTimeRange(parts.join(' '))
      updateIndex(index, restaurant.name, days, openTimes)
    })
  })
  return index
}

const validateTime = (timestr) => {
  const res = /\b((1[0-2]|0?[1-9]):([0-5][0-9])([AaPp][Mm]))/.test(timestr)
  console.log(res)
  if (!res) {
    throw new Error('Invalid time')
  } else {
    console.log('good')
  }
}

const parseTime = (timeStr) => {
  const stripped = timeStr.replaceAll(/\s/g, '')
  validateTime(stripped)
  const period = stripped.slice(-2).toLowerCase()
  const time = stripped.slice(0, stripped.length - 2)
  return normalizeTimeString(time, period)
}

const parseDay = (dayStr) => {
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
        closes: humanizeTime(closes)
      })
    }
  })
  return openRestaurants
}

export const findOpenTables = async (dayStr, time) => {
  if (Object.keys(schedule).length === 0) {
    schedule = await buildIndex()
  }
  const day = parseDay(dayStr)
  const minute = parseTime(time)

  const list = getOpenTables(day, minute)
  return list
}
