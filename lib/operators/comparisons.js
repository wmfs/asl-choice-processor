'use strict'

// Data-test comparison operators. Each takes (inputValue, comparisonValue)
// and returns true/false. Per the spec, a comparison is false when either
// value is the wrong type - there is no type coercion.
const { isNumber, isString, isBoolean, compareStrings } = require('./guards')
const { parseTimestamp, compareTimestamps } = require('../timestamp')

function numeric (test) {
  return (a, b) => isNumber(a) && isNumber(b) && test(a - b)
}

function string (test) {
  return (a, b) => isString(a) && isString(b) && test(compareStrings(a, b))
}

function timestamp (test) {
  return (a, b) => {
    const ta = parseTimestamp(a)
    const tb = parseTimestamp(b)
    return ta !== null && tb !== null && test(compareTimestamps(ta, tb))
  }
}

const EQ = c => c === 0
const GT = c => c > 0
const GTE = c => c >= 0
const LT = c => c < 0
const LTE = c => c <= 0

module.exports = {
  BooleanEquals: (a, b) => isBoolean(a) && isBoolean(b) && a === b,

  NumericEquals: numeric(EQ),
  NumericGreaterThan: numeric(GT),
  NumericGreaterThanEquals: numeric(GTE),
  NumericLessThan: numeric(LT),
  NumericLessThanEquals: numeric(LTE),

  StringEquals: string(EQ),
  StringGreaterThan: string(GT),
  StringGreaterThanEquals: string(GTE),
  StringLessThan: string(LT),
  StringLessThanEquals: string(LTE),

  TimestampEquals: timestamp(EQ),
  TimestampGreaterThan: timestamp(GT),
  TimestampGreaterThanEquals: timestamp(GTE),
  TimestampLessThan: timestamp(LT),
  TimestampLessThanEquals: timestamp(LTE)
}
