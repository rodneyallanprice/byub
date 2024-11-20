import { findOpenTables, init } from './src/lookup.js'

const args = process.argv

init()
  .then(() => {
    const day = args[2]
    let time
    if (args[4]) {
      time = `${args[3]}${args[4]}`
    } else {
      time = args[3]
    }

    const list = findOpenTables(day, time)
    if (list.length) {
      console.log(`\nThe following restaurants are open ${day} at ${time}\n`)
      list.forEach((restaurant) => {
        console.log(`${restaurant.name.padEnd(36, ' ')} closes at ${restaurant.closes.padStart(8, ' ')}`)
      })
      console.log(`\n\n`)
    } else {
      console.log(`\nNo restaurants are open ${day} at ${time})\n\n`)
    }
  })
  .catch(() => {
    console.log(`\nUsage: findfood <day> <time>\n\n findfood Friday 6pm\n\n`)
  })
