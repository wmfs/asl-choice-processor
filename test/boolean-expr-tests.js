/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect

// As inspired-by: http://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html#amazon-states-language-choice-state-rules

const choiceProcessor = require('./../lib')

const tests = {
  Not: [
    {
      choices: {
        Choices: [
          {
            Not: {
              Variable: '$.type',
              StringEquals: 'Private'
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
              StringEquals: 'Private'
            },
            Next: 'NextState'
          }
        ],
        Default: 'DefaultState'
      },
      input: { type: 'Private' },
      expected: 'DefaultState'
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
                NumericGreaterThan: 20
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
      input: { value: 21 },
      expected: 'NextState'
    },
    {
      choices: {
        Choices: [
          {
            And: [
              {
                Variable: '$.value',
                NumericGreaterThan: 20
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
      input: { value: 20 },
      expected: 'DefaultState'
    },
    {
      choices: {
        Choices: [
          {
            And: [
              {
                Variable: '$.value',
                NumericGreaterThan: 20
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
      input: { value: 28 },
      expected: 'DefaultState'
    }
  ],
  Or: [
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
                NumericGreaterThanEquals: 20
              },
              {
                Variable: '$.value',
                NumericLessThan: 30
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

describe('Boolean expression', () => {
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
