'use strict'

module.exports = function isNullOperator (inputValue, comparisonValue, candidateStateName, cache) {
  let nextState

  if (comparisonValue && inputValue === null) {
    nextState = candidateStateName
  } else if (!comparisonValue && inputValue !== null) {
    nextState = candidateStateName
  }

  return nextState
}
