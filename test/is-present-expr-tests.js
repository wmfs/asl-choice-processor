/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect

const choiceProcessor = require('./../lib')

const tests = {
    Not: [
      {
        choices: {
          Choices: [
            {
              Not: {
                Variable: '$.notPresent',
                IsPresent: true
              },
              Next: 'NextState'
            }
          ],
          Default: 'DefaultState'
        },
        input: { type: 'Public' },
        expected: 'NextState'
      },
      {
        choices: {
          Choices: [
            {
              Not: {
                Variable: '$.type',
                IsPresent: false
              },
              Next: 'NextState'
            }
          ],
          Default: 'DefaultState'
        },
        input: { type: 'Public' },
        expected: 'NextState'
      }
    ],
    And: [
      {
        choices: {
          Choices: [
            {
              And: [
                {
                  Variable: '$.value',
                  IsPresent: true
                },
                {
                  Variable: '$.name',
                  IsPresent: true
                }
              ],
              Next: 'NextState'
            }
          ],
          Default: 'DefaultState'
        },
        input: { value: 21, name: "age" },
        expected: 'NextState'
      },
    ],
    Or: [
      {
        choices: {
          Choices: [
            {
              Or: [
                {
                  Variable: '$.value',
                  IsPresent: true
                },
                {
                  Variable: '$.name',
                  IsPresent: true
                }
              ],
              Next: 'NextState'
            }
          ],
          Default: 'DefaultState'
        },
        input: { value: 22 },
        expected: 'NextState'
      },
      {
        choices: {
          Choices: [
            {
              Or: [
                {
                  Variable: '$.value',
                  NumericGreaterThan: 22
                },
                {
                  Variable: '$.value',
                  NumericLessThan: 25
                }
              ],
              Next: 'NextState'
            }
          ],
          Default: 'DefaultState'
        },
        input: { value: 25 },
        expected: 'NextState'
      }
    ],
    Mixed: [
      {
        choices: {
          Choices: [
            {
              Not: {
                Variable: '$.type',
                StringEquals: 'Private'
              },
              Next: 'Public'
            },
            {
              And: [
                {
                  Variable: '$.value',
                  IsPresent: true
                },
                {
                  Variable: '$.type',
                  IsPresent: true
                }
              ],
              Next: 'ValueInTwenties'
            }
          ],
          Default: 'RecordEvent'
        },
        input: { type: 'Private', value: 22 },
        expected: 'ValueInTwenties'
      }
    ]
  }
  
  describe('IsPresent expression', () => {
    for (const [operator, t] of Object.entries(tests)) {
      describe(operator, () => {
        let i = 0
        for (const { choices, input, expected } of t) {
          i++
          it(`${i}`, () => {
            const calculateNextState = choiceProcessor(choices)
            const result = calculateNextState(input)
            expect(result).to.eql(expected)
          })
        }
      })
    }
  })
  