/* eslint-env mocha */

'use strict'

// Choice state behaviour from https://states-language.net/spec.html#choice-state

const chai = require('chai')
const expect = chai.expect

const choiceProcessor = require('./../lib')
const { ChoiceDefinitionError } = choiceProcessor

function nextState (rule, input, context) {
  return choiceProcessor({
    Choices: [{ ...rule, Next: 'Match' }],
    Default: 'Default'
  })(input, context)
}

function expectMatches (rule, cases) {
  for (const [input, expected] of cases) {
    it(`${JSON.stringify(rule)} with ${JSON.stringify(input)} -> ${expected}`, () => {
      expect(nextState(rule, input)).to.equal(expected)
    })
  }
}

describe('Spec compliance', () => {
  describe('IsNumeric', () => {
    expectMatches({ Variable: '$.x', IsNumeric: true }, [
      [{ x: 1 }, 'Match'],
      [{ x: -1.5 }, 'Match'],
      [{ x: 0 }, 'Match'],
      [{ x: '1' }, 'Default'],
      [{ x: null }, 'Default'],
      [{ x: true }, 'Default'],
      [{}, 'Default']
    ])
    expectMatches({ Variable: '$.x', IsNumeric: false }, [
      [{ x: 1 }, 'Default'],
      [{ x: '1' }, 'Match'],
      [{}, 'Match']
    ])
  })

  describe('IsTimestamp', () => {
    expectMatches({ Variable: '$.x', IsTimestamp: true }, [
      [{ x: '2016-03-14T01:59:00Z' }, 'Match'],
      [{ x: '2016-03-14T01:59:00.123456789Z' }, 'Match'],
      [{ x: '2016-03-14T01:59:00+05:30' }, 'Match'],
      [{ x: '2016-03-14T01:59:00-08:00' }, 'Match'],
      [{ x: '2024-02-29T00:00:00Z' }, 'Match'],
      [{ x: '2016-03-14t01:59:00Z' }, 'Default'], // lowercase t
      [{ x: '2016-03-14T01:59:00z' }, 'Default'], // lowercase z
      [{ x: '2016-03-14T01:59:00' }, 'Default'], // no offset
      [{ x: '2016-03-14 01:59:00Z' }, 'Default'], // space separator
      [{ x: '2016-03-14' }, 'Default'],
      [{ x: '2023-02-29T00:00:00Z' }, 'Default'], // not a leap year
      [{ x: '2016-13-01T00:00:00Z' }, 'Default'],
      [{ x: '2016-03-14T24:00:00Z' }, 'Default'],
      [{ x: '2016-03-14T01:59:00+24:00' }, 'Default'],
      [{ x: 1457920740 }, 'Default'],
      [{}, 'Default']
    ])
  })

  describe('StringMatches', () => {
    expectMatches({ Variable: '$.x', StringMatches: 'log-*.txt' }, [
      [{ x: 'log-1.txt' }, 'Match'],
      [{ x: 'log-.txt' }, 'Match'],
      [{ x: 'log-2021-01-01.txt' }, 'Match'],
      [{ x: 'log-1.txt.bak' }, 'Default'],
      [{ x: 'xlog-1.txt' }, 'Default'],
      [{ x: 'log-1xtxt' }, 'Default'], // "." is literal
      [{ x: 1 }, 'Default'],
      [{}, 'Default']
    ])
    expectMatches({ Variable: '$.x', StringMatches: '*' }, [
      [{ x: '' }, 'Match'],
      [{ x: 'anything\nat all' }, 'Match']
    ])
    expectMatches({ Variable: '$.x', StringMatches: 'a\\*b' }, [
      [{ x: 'a*b' }, 'Match'],
      [{ x: 'axb' }, 'Default']
    ])
    expectMatches({ Variable: '$.x', StringMatches: 'a\\\\*' }, [
      [{ x: 'a\\' }, 'Match'],
      [{ x: 'a\\anything' }, 'Match'],
      [{ x: 'a' }, 'Default']
    ])
    expectMatches({ Variable: '$.x', StringMatches: '(^$)[x]+?' }, [
      [{ x: '(^$)[x]+?' }, 'Match'],
      [{ x: 'x' }, 'Default']
    ])
  })

  describe('Comparisons do not coerce types', () => {
    const wrongTypes = [
      [{ Variable: '$.x', NumericEquals: 1 }, ['1', true, null, [1]]],
      [{ Variable: '$.x', NumericGreaterThan: 5 }, ['10', true, [10]]],
      [{ Variable: '$.x', NumericLessThan: 5 }, [null, false, '', []]],
      [{ Variable: '$.x', NumericLessThanEquals: 0 }, [null, false, '', []]],
      [{ Variable: '$.x', StringEquals: '1' }, [1, ['1']]],
      [{ Variable: '$.x', StringLessThan: 'b' }, [1, null, false, ['a']]],
      [{ Variable: '$.x', StringGreaterThanEquals: '' }, [0, null, false]],
      [{ Variable: '$.x', BooleanEquals: false }, [0, '', null, 'false']],
      [{ Variable: '$.x', BooleanEquals: true }, [1, 'true']]
    ]
    for (const [rule, inputs] of wrongTypes) {
      expectMatches(rule, inputs.map(x => [{ x }, 'Default']))
    }
  })

  describe('String comparisons use Unicode code points', () => {
    // U+1F600 is stored as a surrogate pair (0xD83D 0xDE00), which sorts
    // below U+FF5E by UTF-16 code unit but above it by code point
    expectMatches({ Variable: '$.x', StringGreaterThan: '～' }, [
      [{ x: '\u{1F600}' }, 'Match']
    ])
    expectMatches({ Variable: '$.x', StringLessThan: 'abd' }, [
      [{ x: 'abc' }, 'Match'],
      [{ x: 'ab' }, 'Match'],
      [{ x: 'abd' }, 'Default'],
      [{ x: 'abda' }, 'Default']
    ])
  })

  describe('Timestamps compare instants', () => {
    const t = '2016-03-14T01:59:00Z'
    expectMatches({ Variable: '$.x', TimestampEquals: t }, [
      [{ x: t }, 'Match'],
      [{ x: '2016-03-14T02:59:00+01:00' }, 'Match'],
      [{ x: '2016-03-13T20:59:00-05:00' }, 'Match'],
      [{ x: '2016-03-14T01:59:00.000Z' }, 'Match'],
      [{ x: '2016-03-14T01:59:00.001Z' }, 'Default'],
      [{ x: 'not a timestamp' }, 'Default'],
      [{}, 'Default']
    ])
    expectMatches({ Variable: '$.x', TimestampLessThan: '2016-03-14T01:00:00Z' }, [
      [{ x: '2016-03-14T01:30:00+01:00' }, 'Match'],
      [{ x: '2016-03-14T00:59:59.999999999Z' }, 'Match'],
      [{ x: '2016-03-14T01:00:00.000000001Z' }, 'Default']
    ])
    expectMatches({ Variable: '$.x', TimestampGreaterThan: t }, [
      [{ x: '2017-01-01T00:00:00Z' }, 'Match'],
      [{ x: 'zzz' }, 'Default']
    ])
    expectMatches({ Variable: '$.x', TimestampGreaterThanEquals: t }, [
      [{ x: t }, 'Match'],
      [{ x: '2016-03-14T01:58:59Z' }, 'Default']
    ])
    expectMatches({ Variable: '$.x', TimestampLessThanEquals: t }, [
      [{ x: t }, 'Match'],
      [{ x: '2016-03-14T01:59:01Z' }, 'Default']
    ])
  })

  describe('Path variants', () => {
    expectMatches({ Variable: '$.x', TimestampLessThanPath: '$.y' }, [
      [{ x: '2016-03-14T01:30:00+01:00', y: '2016-03-14T01:00:00Z' }, 'Match'],
      [{ x: '2016-03-14T01:30:00Z', y: 'nope' }, 'Default']
    ])
    expectMatches({ Variable: '$.x', StringEqualsPath: '$.y' }, [
      [{ x: 'a', y: 'a' }, 'Match'],
      [{ x: null, y: null }, 'Default'],
      [{ x: 1, y: 1 }, 'Default'],
      [{}, 'Default']
    ])
    expectMatches({ Variable: '$.x', BooleanEqualsPath: '$.y' }, [
      [{ x: false, y: false }, 'Match'],
      [{ x: 0, y: 0 }, 'Default']
    ])
    expectMatches({ Variable: '$.x', NumericGreaterThanPath: '$.limits.max' }, [
      [{ x: 11, limits: { max: 10 } }, 'Match'],
      [{ x: 11, limits: {} }, 'Default']
    ])
  })

  describe('Nested boolean expressions', () => {
    const inTwenties = {
      And: [
        { Variable: '$.n', NumericGreaterThanEquals: 20 },
        { Variable: '$.n', NumericLessThan: 30 }
      ]
    }
    expectMatches({ Or: [inTwenties, { Variable: '$.vip', BooleanEquals: true }] }, [
      [{ n: 25, vip: false }, 'Match'],
      [{ n: 5, vip: true }, 'Match'],
      [{ n: 5, vip: false }, 'Default']
    ])
    expectMatches({ Not: inTwenties }, [
      [{ n: 25 }, 'Default'],
      [{ n: 35 }, 'Match']
    ])
    expectMatches({ And: [{ Not: { Variable: '$.a', StringEquals: 'x' } }, { Not: { Not: { Variable: '$.b', IsPresent: true } } }] }, [
      [{ a: 'y', b: 1 }, 'Match'],
      [{ a: 'x', b: 1 }, 'Default'],
      [{ a: 'y' }, 'Default']
    ])
    expectMatches({ Or: [{ And: [{ Or: [{ Not: { Variable: '$.a', NumericEquals: 1 } }] }] }] }, [
      [{ a: 2 }, 'Match'],
      [{ a: 1 }, 'Default']
    ])

    it('short-circuits And', () => {
      const rule = { And: [{ Variable: '$.a', IsPresent: true }, { Variable: '$.a.b', StringEquals: 'x' }] }
      expect(nextState(rule, {})).to.equal('Default')
    })

    it('ignores Next on nested rules', () => {
      const rule = { And: [{ Variable: '$.a', NumericEquals: 1, Next: 'Ignored' }] }
      expect(nextState(rule, { a: 1 })).to.equal('Match')
    })
  })

  describe('Missing and non-object input', () => {
    for (const input of [undefined, null, 42, 'text', true]) {
      it(`IsPresent/IsNull on $.x with input ${JSON.stringify(input)} don't match`, () => {
        expect(nextState({ Variable: '$.x', IsPresent: true }, input)).to.equal('Default')
        expect(nextState({ Variable: '$.x', IsNull: true }, input)).to.equal('Default')
      })
    }

    it('"$" selects the whole input, even when it is not an object', () => {
      expect(nextState({ Variable: '$', NumericEquals: 42 }, 42)).to.equal('Match')
      expect(nextState({ Variable: '$', StringEquals: 'text' }, 'text')).to.equal('Match')
      expect(nextState({ Variable: '$', IsNull: true }, null)).to.equal('Match')
    })

    it('an explicit null is present', () => {
      expect(nextState({ Variable: '$.x', IsPresent: true }, { x: null })).to.equal('Match')
      expect(nextState({ Variable: '$.x', IsNull: true }, { x: null })).to.equal('Match')
    })
  })

  describe('Context object ($$) paths', () => {
    const context = { Execution: { Name: 'exec-1', Input: { retries: 3 } } }

    it('reads Variable from the context object', () => {
      expect(nextState({ Variable: '$$.Execution.Name', StringEquals: 'exec-1' }, {}, context)).to.equal('Match')
    })

    it('reads ...Path comparison values from the context object', () => {
      expect(nextState({ Variable: '$.retries', NumericLessThanPath: '$$.Execution.Input.retries' }, { retries: 2 }, context)).to.equal('Match')
    })

    it('treats $$ paths as missing when no context object is given', () => {
      expect(nextState({ Variable: '$$.Execution.Name', IsPresent: true }, {})).to.equal('Default')
    })

    it('does not mix up $ and $$ paths in the cache', () => {
      const calculate = choiceProcessor({
        Choices: [{ And: [{ Variable: '$.Execution.Name', StringEquals: 'input' }, { Variable: '$$.Execution.Name', StringEquals: 'exec-1' }], Next: 'Match' }],
        Default: 'Default'
      })
      expect(calculate({ Execution: { Name: 'input' } }, context)).to.equal('Match')
    })
  })

  describe('Results', () => {
    it('returns the first matching rule in order', () => {
      const calculate = choiceProcessor({
        Choices: [
          { Variable: '$.n', NumericGreaterThan: 10, Next: 'Big' },
          { Variable: '$.n', NumericGreaterThan: 0, Next: 'Positive' }
        ],
        Default: 'Other'
      })
      expect(calculate({ n: 20 })).to.equal('Big')
      expect(calculate({ n: 5 })).to.equal('Positive')
      expect(calculate({ n: -1 })).to.equal('Other')
    })

    it('returns null when nothing matches and there is no Default', () => {
      const calculate = choiceProcessor({ Choices: [{ Variable: '$.n', NumericEquals: 1, Next: 'One' }] })
      expect(calculate({ n: 2 })).to.equal(null)
    })

    it('does not mutate the definition', () => {
      const definition = {
        Choices: [{ Variable: '$.x', NumericEqualsPath: '$.y', Next: 'Match' }, { Not: { Variable: '$.x', IsNull: true }, Next: 'NotNull' }],
        Default: 'Default'
      }
      const copy = JSON.parse(JSON.stringify(definition))
      const calculate = choiceProcessor(definition)
      calculate({ x: 1, y: 1 })
      calculate({ x: 2, y: 1 })
      expect(definition).to.eql(copy)
    })
  })

  describe('Tymly extensions', () => {
    expectMatches({ Variable: '$.x', Includes: { id: 2 } }, [
      [{ x: [{ id: 1 }, { id: 2 }] }, 'Match'],
      [{ x: [{ id: 1 }] }, 'Default'],
      [{ x: { id: 2 } }, 'Default']
    ])
    expectMatches({ Variable: '$.x', IsUndefined: true }, [
      [{}, 'Match'],
      [{ x: null }, 'Default']
    ])
  })

  describe('Invalid definitions are rejected when the processor is created', () => {
    const invalid = [
      ['no definition', undefined, /definition must be an object/],
      ['no Choices', {}, /Choices: must be a non-empty array/],
      ['empty Choices', { Choices: [] }, /Choices: must be a non-empty array/],
      ['bad Default', { Choices: [{ Variable: '$.x', IsNull: true, Next: 'A' }], Default: 42 }, /Default: must be a state name/],
      ['rule not an object', { Choices: ['nope'] }, /Choices\[0\]: a Choice Rule must be an object/],
      ['missing Next', { Choices: [{ Variable: '$.x', IsNull: true }] }, /Choices\[0\]: top-level Choice Rules must have a Next/],
      ['misspelt operator', { Choices: [{ Variable: '$.x', NumericEqual: 1, Next: 'A' }] }, /unrecognised: NumericEqual/],
      ['no operator', { Choices: [{ Variable: '$.x', Next: 'A' }] }, /no comparison or boolean operator found$/],
      ['two operators', { Choices: [{ Variable: '$.x', NumericEquals: 1, IsNull: false, Next: 'A' }] }, /only one operator is allowed per rule, found NumericEquals, IsNull/],
      ['missing Variable', { Choices: [{ NumericEquals: 1, Next: 'A' }] }, /Variable must be a Path/],
      ['Variable not a Path', { Choices: [{ Variable: 'x', NumericEquals: 1, Next: 'A' }] }, /Variable must be a Path/],
      ['Numeric with a string', { Choices: [{ Variable: '$.x', NumericEquals: '1', Next: 'A' }] }, /NumericEquals must be a number, got "1"/],
      ['String with a number', { Choices: [{ Variable: '$.x', StringEquals: 1, Next: 'A' }] }, /StringEquals must be a string, got 1/],
      ['String with null', { Choices: [{ Variable: '$.x', StringEquals: null, Next: 'A' }] }, /StringEquals must be a string, got null/],
      ['StringMatches with a number', { Choices: [{ Variable: '$.x', StringMatches: 1, Next: 'A' }] }, /StringMatches must be a string/],
      ['bad timestamp', { Choices: [{ Variable: '$.x', TimestampEquals: '2016-03-14', Next: 'A' }] }, /TimestampEquals must be an RFC3339 timestamp/],
      ['BooleanEquals with a string', { Choices: [{ Variable: '$.x', BooleanEquals: 'true', Next: 'A' }] }, /BooleanEquals must be a boolean/],
      ['IsPresent with a string', { Choices: [{ Variable: '$.x', IsPresent: 'true', Next: 'A' }] }, /IsPresent must be a boolean/],
      ['Path variant without a Path', { Choices: [{ Variable: '$.x', NumericEqualsPath: 'y', Next: 'A' }] }, /NumericEqualsPath must be a Path/],
      ['StringMatchesPath', { Choices: [{ Variable: '$.x', StringMatchesPath: '$.y', Next: 'A' }] }, /unrecognised: StringMatchesPath/],
      ['empty And', { Choices: [{ And: [], Next: 'A' }] }, /Choices\[0\].And: must be a non-empty array/],
      ['Or not an array', { Choices: [{ Or: { Variable: '$.x', IsNull: true }, Next: 'A' }] }, /Choices\[0\].Or: must be a non-empty array/],
      ['bad nested rule', { Choices: [{ Or: [{ Variable: '$.x', IsNull: true }, { Not: { Variable: '$.y', NumericEqual: 1 } }], Next: 'A' }] }, /Choices\[0\].Or\[1\].Not: no comparison or boolean operator found/],
      ['JSONata state', { QueryLanguage: 'JSONata', Choices: [{ Condition: '{% true %}', Next: 'A' }] }, /JSONata Choice states/],
      ['JSONata Condition rule', { Choices: [{ Condition: '{% true %}', Next: 'A' }] }, /JSONata Condition rules are not supported/]
    ]

    for (const [name, definition, message] of invalid) {
      it(name, () => {
        expect(() => choiceProcessor(definition)).to.throw(ChoiceDefinitionError, message)
      })
    }

    it('allows Comment on rules', () => {
      expect(nextState({ Variable: '$.x', IsNull: true, Comment: 'why' }, { x: null })).to.equal('Match')
    })
  })
})
