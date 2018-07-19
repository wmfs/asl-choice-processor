'use strict'

module.exports = function isUndefinedOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState
  if (comparisonValue === true) {
    if (inputValue === undefined) {
      nextState = candidateStateName
    }
  } else if (comparisonValue === false) {
    if (inputValue !== undefined) {
      nextState = candidateStateName
    }
  }
  return nextState
}
