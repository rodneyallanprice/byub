import { expect } from 'chai'
import {expandDayRange, getOffsetFromTime, getTimeFromOffset, nextDay, parseDayRange, parseTime, parseTimeRange, insertSchedule, buildMasterSchedule, splitDaysFromTimeRange} from '../../src/schedule.js'

const inRange = (daySchedule, offset) => {
    let found = false
    daySchedule.forEach((sched) => {
        if(offset >= sched.open && offset < sched.closed) {
            found = true
        }
    })
    return found
}

describe('Test schedule.js', () => {
    describe('Test nextDay()', () => {
        describe('when a day is passed in', () => {
            it('should return the next day', () => {
                let tomorrow = nextDay('Mon')
                expect(tomorrow).to.be.equal('Tue')
                tomorrow = nextDay('Tue')
                expect(tomorrow).to.be.equal('Wed')
                tomorrow = nextDay('Wed')
                expect(tomorrow).to.be.equal('Thu')
                tomorrow = nextDay('Thu')
                expect(tomorrow).to.be.equal('Fri')
                tomorrow = nextDay('Fri')
                expect(tomorrow).to.be.equal('Sat')
                tomorrow = nextDay('Sat')
                expect(tomorrow).to.be.equal('Sun')
                tomorrow = nextDay('Sun')
                expect(tomorrow).to.be.equal('Mon')
            })
        })
    })
    describe('Test expandDayRange()', () => {
        describe('when given a range', () => {
            it('should return an array with each day', () => {
                let expanded = expandDayRange('Mon-Fri')
                expect(JSON.stringify(expanded)).to.be.equal('["Mon","Tue","Wed","Thu","Fri"]')
                expanded = expandDayRange('Wed')
                expect(JSON.stringify(expanded)).to.be.equal('["Wed"]')
                expanded = expandDayRange('Thu-Tue')
                expect(JSON.stringify(expanded)).to.be.equal('["Thu","Fri","Sat","Sun","Mon","Tue"]')
            })
        })
    })
    describe('Test parseDayRange()', () => {
        describe('when given a string of day ranges', () => {
            it('should return an array of all days', () => {
                let expanded = parseDayRange('Mon-Fri')
                expect(JSON.stringify(expanded)).to.be.equal('["Mon","Tue","Wed","Thu","Fri"]')
                expanded = parseDayRange('Mon-Thu, Sun')
                expect(JSON.stringify(expanded)).to.be.equal('["Mon","Tue","Wed","Thu","Sun"]')
                expanded = parseDayRange('Mon, Wed, Fri-Sat')
                expect(JSON.stringify(expanded)).to.be.equal('["Mon","Wed","Fri","Sat"]')
                expanded = parseDayRange('Mon, Wed,Fri-Sat')
                expect(JSON.stringify(expanded)).to.be.equal('["Mon","Wed","Fri","Sat"]')
                expanded = parseDayRange('Sat')
                expect(JSON.stringify(expanded)).to.be.equal('["Sat"]')
            })
        })
    })

    describe('Test splitDaysFromTimeRange', () => {
        describe('when a restaurant schedule is passed in with a single day', () => {
            it('should split the day range from the time range', () => {
                const {dayRange, timeRange} = splitDaysFromTimeRange('Sun 10 am - 11 pm')
                expect(dayRange).to.be.equal('Sun')
                expect(timeRange).to.be.equal('10 am - 11 pm')
            })
        })
        describe('when a restaurant schedule is passed in with a single day range', () => {
            it('should split the day range from the time range', () => {
                const {dayRange, timeRange} = splitDaysFromTimeRange('Mon-Thu 11:30 am - 10 pm')
                expect(dayRange).to.be.equal('Mon-Thu')
                expect(timeRange).to.be.equal('11:30 am - 10 pm')
            })
        })
        describe('when a restaurant schedule is passed in with multiple day ranges', () => {
            it('should split the day range from the time range', () => {
                const {dayRange, timeRange} = splitDaysFromTimeRange('Mon-Thu, Sun 11:30 am - 10 pm')
                expect(dayRange).to.be.equal('Mon-Thu, Sun')
                expect(timeRange).to.be.equal('11:30 am - 10 pm')
            })
        })
    })

    describe('Test getOffSetFromTime()', () => {
        describe('when given a human readable time', () => {
            it('should return the number of minutes since midnight', () => {
                let minutes = getOffsetFromTime('12', 'am')
                expect(minutes).to.be.equal(0)
                minutes = getOffsetFromTime('12:00', 'am')
                expect(minutes).to.be.equal(0)
                minutes = getOffsetFromTime('12', 'pm')
                expect(minutes).to.be.equal(12 * 60)
                minutes = getOffsetFromTime('12:00', 'pm')
                expect(minutes).to.be.equal(12 * 60)
                minutes = getOffsetFromTime('5:30', 'AM')
                expect(minutes).to.be.equal(5 * 60 + 30)
                minutes = getOffsetFromTime('1', 'pM')
                expect(minutes).to.be.equal(13 * 60)
                minutes = getOffsetFromTime('12:30', 'PM')
                expect(minutes).to.be.equal(12 * 60 + 30)
                minutes = getOffsetFromTime('12:30', 'am')
                expect(minutes).to.be.equal(30)
            })
        })
    })
    describe('Test getTimeFromOffset()', () => {
        describe('when given the number of minutes since midnight', () => {
            it('should return a human readable time', () => {
                let timeStr = getTimeFromOffset(0)
                expect(timeStr).to.be.equal('12:00 am')
                timeStr = getTimeFromOffset(12 * 60)
                expect(timeStr).to.be.equal('12:00 pm')
                timeStr = getTimeFromOffset(5 * 60 + 30)
                expect(timeStr).to.be.equal('5:30 am')
                timeStr = getTimeFromOffset(13 * 60)
                expect(timeStr).to.be.equal('1:00 pm')
                timeStr = getTimeFromOffset(12 * 60 + 30)
                expect(timeStr).to.be.equal('12:30 pm')
                timeStr = getTimeFromOffset(30)
                expect(timeStr).to.be.equal('12:30 am')
            })
        })
    })
    describe('Test parseTime()', () => {
        describe('when given a human readable time', () => {
            it('should return the number of minutes since midnight', () => {
                let minutes = parseTime('12 am')
                expect(minutes).to.be.equal(0)
                minutes = parseTime('12:00 am')
                expect(minutes).to.be.equal(0)
                minutes = parseTime('12 pm')
                expect(minutes).to.be.equal(12 * 60)
                minutes = parseTime('12:00 pm')
                expect(minutes).to.be.equal(12 * 60)
                minutes = parseTime('5:30 AM')
                expect(minutes).to.be.equal(5 * 60 + 30)
                minutes = parseTime('1 pM')
                expect(minutes).to.be.equal(13 * 60)
                minutes = parseTime('12:30 PM')
                expect(minutes).to.be.equal(12 * 60 + 30)
                minutes = parseTime('12:30 am')
                expect(minutes).to.be.equal(30)
            })
        })
    })
    describe('Test parseTimeRange()', () => {
        describe('when given a human readable time range', () => {
            it('should return the number of minutes since midnight for start, stop, and next day spillover', () => {
                let offsets = parseTimeRange('11 am - 12 am')
                expect(JSON.stringify(offsets)).to.be.equal('{"start":660,"stop":1440,"spillOver":0}')
                offsets = parseTimeRange('7 am - 3 pm')
                expect(JSON.stringify(offsets)).to.be.equal('{"start":420,"stop":900,"spillOver":0}')
                offsets = parseTimeRange('10 am - 12:30 am')
                expect(JSON.stringify(offsets)).to.be.equal('{"start":600,"stop":1440,"spillOver":30}')
                offsets = parseTimeRange('11:30 am - 10:30 pm')
                expect(JSON.stringify(offsets)).to.be.equal('{"start":690,"stop":1350,"spillOver":0}')
                offsets = parseTimeRange('11 am - 1 am')
                expect(JSON.stringify(offsets)).to.be.equal('{"start":660,"stop":1440,"spillOver":60}')
                offsets = parseTimeRange('8:25 AM - 12 pm')
                expect(JSON.stringify(offsets)).to.be.equal('{"start":505,"stop":720,"spillOver":0}')
            })
        })
    })
    describe('Test insertSchedule()', () => {
        describe('when given a schedule for a restaurant', () => {
            const inRange = (daySchedule, offset) => {
                let found = false
                daySchedule.forEach((sched) => {
                    if(offset >= sched.open && offset < sched.closed) {
                        found = true
                    }
                })
                return found
            }
            describe('is open past midnight', () => {
                it('should create openings on both days', () => {
                    const master = {}
                    insertSchedule(master, 'Thai Stick Restaurant', ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], {start: 11*60, stop: 24*60, spillOver: 60})
                    expect(typeof(master['Thai Stick Restaurant'])).to.be.equal('object')
                    expect(Object.keys(master['Thai Stick Restaurant']).length).to.be.equal(7)
                    expect(master['Thai Stick Restaurant'].Mon.length).to.be.equal(2)
                    expect(inRange(master['Thai Stick Restaurant'].Mon, 10 * 60)).to.be.false
                    expect(inRange(master['Thai Stick Restaurant'].Mon, 10)).to.be.true
                    expect(inRange(master['Thai Stick Restaurant'].Mon, 1439)).to.be.true
                })
            })
            describe('is closed early and late', () => {
                it('should create just oneopenings on the day', () => {
                    const master = {}
                    insertSchedule(master, 'Chili Lemon Garlic', ["Mon","Tue","Wed","Thu","Fri"], {start: 11*60, stop: 22*60, spillOver: 0})
                    expect(typeof(master['Chili Lemon Garlic'])).to.be.equal('object')
                    expect(Object.keys(master['Chili Lemon Garlic']).length).to.be.equal(5)
                    expect(master['Chili Lemon Garlic'].Mon.length).to.be.equal(1)
                    expect(inRange(master['Chili Lemon Garlic'].Mon, 10 * 60)).to.be.false
                    expect(inRange(master['Chili Lemon Garlic'].Mon, 12 * 60)).to.be.true
                    expect(inRange(master['Chili Lemon Garlic'].Mon, 1380)).to.be.false
                })
            })

        })
    })

    describe('Test buildMasterSchedule()', () => {
        describe('when rest_hours.json if found', () => {
            it('should return a master schedule', async () => {
                const master = await buildMasterSchedule()
                expect(Object.keys(master).length).to.be.equal(51)
                expect(typeof(master['Penang Garden'])).to.be.equal('object')
                expect(Object.keys(master['Penang Garden']).length).to.be.equal(7)
                expect(master['Penang Garden'].Mon.length).to.be.equal(1)
                expect(inRange(master['Penang Garden'].Mon, 22 * 60)).to.be.false
                expect(inRange(master['Penang Garden'].Fri, 22 * 60)).to.be.true
                expect(inRange(master['Penang Garden'].Sun, 22 * 60)).to.be.true
                expect(inRange(master['Penang Garden'].Mon, 10)).to.be.false
                expect(inRange(master['Penang Garden'].Sat, 1439)).to.be.false
            })
        })
    })
})