'use strict'

module.exports = function isPresentOperator (inputValue, comparisonValue, candidateStateName, cache) {
  const IsUndefined = require('./is-undefined')
  return IsUndefined(inputValue, !comparisonValue, candidateStateName, cache)
}
