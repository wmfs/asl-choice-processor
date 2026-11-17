'use strict'

// Tymly extensions - these operators are not part of the States Language
// spec, and are kept for compatibility with existing state machines.
const isEqual = require('lodash/isEqual')

module.exports = {
  // Matches when the input is an array containing the comparison value
  Includes: (value, item) => Array.isArray(value) && value.some(v => isEqual(v, item)),
  // The opposite of IsPresent
  IsUndefined: (value, expected) => (value === undefined) === expected
}
