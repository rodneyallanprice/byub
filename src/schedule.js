import { promises as fs } from 'fs'

export const witchingHour = 24 * 60

const getJson = async () => {
  return JSON.parse(await fs.readFile('rest_hours.json', 'utf-8'))
}

const daysOfTheWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const stripWhitespace = (str) => {
  return str.replaceAll(/\s/g, '')
}

export const nextDay = (day) => {
  if (day === 'Sun') {
    return 'Mon'
  }
  const todayIdx = daysOfTheWeek.findIndex((weekday) => weekday === day)
  return daysOfTheWeek[todayIdx + 1]
}

export const expandDayRange = (dayRange) => {
  const dayArray = dayRange.split('-')
  if (dayArray.length === 1) {
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
  dayRanges.forEach((dayRange) => {
    days.push(...expandDayRange(dayRange))
  })
  return days
}

export const splitDaysFromTimeRange = (datSchedule) => {
  const parts = datSchedule.split(' ')
  const dayParts = []

  while (Number.isNaN(Number(parts[0][0]))) {
    dayParts.push(parts.shift())
  }

  const dayRange = dayParts.join(' ')
  const timeRange = parts.join(' ')

  return {
    dayRange,
    timeRange,
  }
}

export const getOffsetFromTime = (timeStr, period) => {
  const timeParts = timeStr.split(':')
  let hours = parseInt(timeParts[0], 10)
  const minutes = parseInt(timeParts[1], 10) || 0
  if (period.toLowerCase() === 'pm') {
    if (hours !== 12) {
      hours += 12
    }
  } else if (hours === 12) {
    hours -= 12
  }
  return hours * 60 + minutes
}

export const getTimeFromOffset = (offset) => {
  let hour = Math.floor(offset / 60)
  const minutes = offset % 60
  let period
  if (hour === 0) {
    hour = 12
    period = 'am'
  } else if (hour === 12) {
    period = 'pm'
  } else if (hour > 12) {
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
  if (stopOffset >= startOffset) {
    stop = stopOffset
  } else {
    stop = witchingHour
    if (stopOffset !== 0) {
      spillOver = stopOffset
    }
  }
  return { start, stop, spillOver }
}

export const insertSchedule = (masterSchedule, name, days, times) => {
  if (!masterSchedule[name]) {
    masterSchedule[name] = {}
  }
  const bizSchedule = masterSchedule[name]
  days.forEach((day) => {
    if (!bizSchedule[day]) {
      bizSchedule[day] = []
    }
    bizSchedule[day].push({
      open: times.start,
      closed: times.stop,
    })
    if (times.spillOver) {
      const tomorrow = nextDay(day)
      if (!bizSchedule[tomorrow]) {
        bizSchedule[tomorrow] = []
      }
      bizSchedule[tomorrow].push({
        open: 0,
        closed: times.spillOver,
      })
    }
  })
}

export const buildMasterSchedule = async () => {
  const masterSchedule = {}
  const restaurants = await getJson()
  restaurants.forEach((restaurant) => {
    restaurant.times.forEach((restaurantTime) => {
      const { dayRange, timeRange } = splitDaysFromTimeRange(restaurantTime)
      const days = parseDayRange(dayRange)
      const openTimes = parseTimeRange(timeRange)
      insertSchedule(masterSchedule, restaurant.name, days, openTimes)
    })
  })
  return masterSchedule
}
