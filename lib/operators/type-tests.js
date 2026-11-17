'use strict'

// Type-test operators. The comparison value is a boolean: true means "matches
// when the test passes", false means "matches when the test fails".
const { isNumber, isString, isBoolean } = require('./guards')
const { parseTimestamp } = require('../timestamp')

function typeTest (test) {
  return (value, expected) => test(value) === expected
}

module.exports = {
  IsBoolean: typeTest(isBoolean),
  IsNull: typeTest(v => v === null),
  IsNumeric: typeTest(isNumber),
  IsPresent: typeTest(v => v !== undefined),
  IsString: typeTest(isString),
  IsTimestamp: typeTest(v => parseTimestamp(v) !== null)
}
