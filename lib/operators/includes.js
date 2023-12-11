'use strict'

module.exports = function includesOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (Array.isArray(inputValue) && inputValue.includes(comparisonValue)) {
    nextState = candidateStateName
  }
  return nextState
}
