import { expect } from 'chai'
import {nextDay} from '../../src/schedule.js'

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
})