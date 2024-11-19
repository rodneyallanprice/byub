import { expect, assert } from 'chai'
import { witchingHour } from '../../src/schedule.js'
import {
  init,
  parseRequestTime,
  parseRequestDay,
  validateTimeString,
  calculateAmClosingTime,
  calculateClosingTime,
  getOpenTables,
  findOpenTables,
} from '../../src/lookup.js'

export const expectThrow = (testFunction, expectedError) => {
  let error
  try {
    testFunction()
  } catch (err) {
    error = err
  }

  ;['statusCode', 'message'].forEach((key) => {
    assert(error, `The expected error '${expectedError}' was not thrown`)
    expect(error[key], `${key} of errors do not match`).to.eql(expectedError[key])
  })
}

describe('Test lookup.js', () => {
  describe('Test input validation', () => {
    describe('Test validateTimeString()', () => {
      describe('when an invalid time is passed in', () => {
        it('should throw an error', () => {
          let tryTime = () => {
            validateTimeString('13:52pm')
          }
          expectThrow(tryTime, new Error('Invalid time'))

          tryTime = () => {
            validateTimeString('10:10fm')
          }
          expectThrow(tryTime, new Error('Invalid time'))

          tryTime = () => {
            validateTimeString('100:10pm')
          }
          expectThrow(tryTime, new Error('Invalid time'))

          tryTime = () => {
            validateTimeString('x0:10fm')
          }
          expectThrow(tryTime, new Error('Invalid time'))

          tryTime = () => {
            validateTimeString('1:60am')
          }
          expectThrow(tryTime, new Error('Invalid time'))
        })
      })

      describe('when a valid time string is passed in', () => {
        it('should not throw an error', () => {
          validateTimeString('12:00 am')
          validateTimeString('12:00 pm')
          validateTimeString('1:59 pm')
          validateTimeString('02:10 am')
          validateTimeString('11:30 pm')
        })
      })
    })

    describe('Test parseRequestTime()', () => {
      describe('when an invalid time is passed in', () => {
        it('should throw an error', () => {
          const tryTime = () => {
            parseRequestTime('13:52pm')
          }
          expectThrow(tryTime, new Error('Invalid time'))
        })
      })

      describe('when a valid time string is passed in', () => {
        it('should return the number of seconds from midnight', () => {
          expect(parseRequestTime('12:00am')).to.be.equal(0)
          expect(parseRequestTime('12:00pm')).to.be.equal(12 * 60)
          expect(parseRequestTime('11:59pm')).to.be.equal(24 * 60 - 1)
          expect(parseRequestTime('02:10am')).to.be.equal(2 * 60 + 10)
          expect(parseRequestTime('1:11am')).to.be.equal(71)
          expect(parseRequestTime('11:30pm')).to.be.equal(23 * 60 + 30)
          expect(parseRequestTime('12am')).to.be.equal(0)
          expect(parseRequestTime('12 pm')).to.be.equal(12 * 60)
          expect(parseRequestTime('11:59 pm')).to.be.equal(24 * 60 - 1)
          expect(parseRequestTime('02:10am')).to.be.equal(2 * 60 + 10)
          expect(parseRequestTime('1:11 AM')).to.be.equal(71)
          expect(parseRequestTime('11:30PM')).to.be.equal(23 * 60 + 30)
        })
      })
    })

    describe('Test parseRequestDay()', () => {
      describe('when an unrecognized day string is passed in', () => {
        it('should throw an error', () => {
          const tryTime = () => {
            parseRequestDay('bogus')
          }
          expectThrow(tryTime, new Error('unrecognized day'))
        })
      })

      describe('when a recognized day string is passed in', () => {
        it('should return a capitalized 3 character day string', () => {
          expect(parseRequestDay('saturday')).to.be.equal('Sat')
          expect(parseRequestDay('SUN')).to.be.equal('Sun')
          expect(parseRequestDay('Mo')).to.be.equal('Mon')
          expect(parseRequestDay('Tuesday')).to.be.equal('Tue')
          expect(parseRequestDay('WEDNESDAY')).to.be.equal('Wed')
          expect(parseRequestDay('fri')).to.be.equal('Fri')
        })
      })
    })
  })

  describe('Test lookup code', () => {
    before(async () => {
      await init()
    })

    describe('Test calculateAmClosingTime()', () => {
      describe('When a restaurant is open at the requested time and it is open past midnight', () => {
        it('should return the number of seconds before it closes the next day', () => {
          expect(calculateAmClosingTime('Hanuri', 'Sun')).to.be.equal(0)
          expect(calculateAmClosingTime(`Naan 'N' Curry`, 'Wed')).to.be.equal(4 * 60)
          expect(calculateAmClosingTime('Sabella & La Torre', 'Fri')).to.be.equal(30)
        })
      })
    })

    describe('Test calculateClosingTime()', () => {
      describe('When a restaurant is open at the requested time', () => {
        it('should return the number of seconds after midnight on the day it closes', () => {
          expect(calculateClosingTime('Hanuri', 'Sun', witchingHour)).to.be.equal(0)
          expect(calculateClosingTime(`Naan 'N' Curry`, 'Wed', witchingHour)).to.be.equal(4 * 60)
          expect(calculateClosingTime(`Cesario's`, 'Thu', 22 * 60)).to.be.equal(22 * 60)
          expect(calculateClosingTime('The Cheesecake Factory', 'Sat', witchingHour)).to.be.equal(30)
          expect(calculateClosingTime('The Cheesecake Factory', 'Sun', 23 * 60)).to.be.equal(23 * 60)
        })
      })
    })

    describe('Test getOpenTables()', () => {
      describe('When a day string and time (in minutes from midnight) is requested', () => {
        it('should return a list of restaurants that are open at that time and when they close', () => {
          expect(getOpenTables('Fri', witchingHour - 1).length).to.be.equal(10)
          expect(getOpenTables('Sun', 0).length).to.be.equal(6)
          expect(getOpenTables('Fri', 13 * 60).length).to.be.equal(49)
          expect(getOpenTables('Tue', 23 * 60).length).to.be.equal(7)
          expect(getOpenTables('Thu', 3 * 60).length).to.be.equal(1)
          expect(getOpenTables('Thu', 3 * 60)[0].name).to.be.equal(`Naan 'N' Curry`)
          expect(getOpenTables('Thu', 3 * 60)[0].closes).to.be.equal('4:00 am')
        })
      })
    })

    describe('Test findOpenTables()', () => {
      describe('When a day string and time string are requested', () => {
        it('should return a list of restaurants that are open at that time and when they close', () => {
          expect(findOpenTables('Fri', '11:59pm').length).to.be.equal(10)
          expect(findOpenTables('Sun', '12 am').length).to.be.equal(6)
          expect(findOpenTables('Fri', '1:00 pm').length).to.be.equal(49)
          expect(findOpenTables('Tue', '11PM').length).to.be.equal(7)
          expect(findOpenTables('Thu', '3:00 AM').length).to.be.equal(1)
        })
      })
    })
  })
})
