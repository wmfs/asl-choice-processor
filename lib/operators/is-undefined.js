'use strict'

module.exports = function isUndefinedOperator (inputValue, comparisonValue, candidateStateName, cache) {
  const isUndefined = inputValue === undefined

  if (isUndefined && comparisonValue === true) {
    return candidateStateName
  }

  if (!isUndefined && comparisonValue !== true) {
    return candidateStateName
  }
}
