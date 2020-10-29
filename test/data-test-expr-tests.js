/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect

// As inspired-by: http://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html#amazon-states-language-choice-state-rules

const choiceProcessor = require('./../lib')

const tests = {
  Includes: [
    [['A', 'G'], 'A', 'NextState'],
    [['A', 'G'], 'G', 'NextState'],
    [[1, 2], 1, 'NextState'],
    [[1, null], null, 'NextState'],
    [[1, undefined], undefined, 'NextState'],

    [['A', 'G'], 'F', 'DefaultState'],
    [[1, 2], null, 'DefaultState'],
    [[1, 2], undefined, 'DefaultState']
  ],
  NumericEquals: [
    [1, 1, 'NextState'],

    [1, 2, 'DefaultState'],
    [1, 3, 'DefaultState'],
    [null, 3, 'DefaultState'],
    [undefined, 3, 'DefaultState'],
    ['hello world', 3, 'DefaultState'],
    ['3', 3, 'DefaultState']
  ],
  NumericGreaterThan: [
    [3, 1, 'NextState'],

    [1, 1, 'DefaultState'],
    [1, 3, 'DefaultState']
  ],
  NumericGreaterThanEquals: [
    [3, 1, 'NextState'],
    [1, 1, 'NextState'],

    [1, 3, 'DefaultState']
  ],
  NumericLessThan: [
    [1, 3, 'NextState'],

    [1, 1, 'DefaultState'],
    [3, 1, 'DefaultState']
  ],
  NumericLessThanEquals: [
    [1, 3, 'NextState'],
    [1, 1, 'NextState'],

    [3, 1, 'DefaultState']
  ],
  StringEquals: [
    ['Hello World', 'Hello World', 'NextState'],
    [null, null, 'NextState'],
    [undefined, undefined, 'NextState'],
    [1, 1, 'NextState'],

    ['Hello World', 'Hello WORLD', 'DefaultState'],
    ['1', 1, 'DefaultState'] // todo: should we .toString() on the comparison and input values?
  ],
  IsNull: [
    [null, true, 'NextState'],
    ['HELLO_WORLD', false, 'NextState'],

    [null, false, 'DefaultState'],
    ['HELLO_WORLD', true, 'DefaultState']
  ]
}

describe('Data-test expression', () => {
  for (const [operator, t] of Object.entries(tests)) {
    describe(operator, () => {
      for (const [input, comparisonValue, expected] of t) {
        it(`Input: ${input} Comparison: ${comparisonValue}`, () => {
          const calculateNextState = choiceProcessor(
            {
              Choices: [
                {
                  Variable: '$.foo',
                  [operator]: comparisonValue,
                  Next: 'NextState'
                }
              ],
              Default: 'DefaultState'
            }
          )
          const result = calculateNextState({ foo: input })
          expect(result).to.eql(expected)
        })
      }
    })

    describe(`${operator}Path`, () => {
      for (const [input, comparisonValue, expected] of t) {
        it(`Input: ${input} Comparison: ${comparisonValue}`, () => {
          const calculateNextState = choiceProcessor(
            {
              Choices: [
                {
                  Variable: '$.foo',
                  [`${operator}Path`]: '$.comparison',
                  Next: 'NextState'
                }
              ],
              Default: 'DefaultState'
            }
          )
          const result = calculateNextState({ foo: input, comparison: comparisonValue })
          expect(result).to.eql(expected)
        })
      }
    })
  }
})
