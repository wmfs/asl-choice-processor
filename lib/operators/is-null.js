'use strict'

module.exports = function isNullOperator (inputValue, comparisonValue, candidateStateName, cache) {
  const isNull = inputValue === null

  if (isNull && comparisonValue === true) {
    return candidateStateName
  }

  if (!isNull && comparisonValue !== true) {
    return candidateStateName
  }
}
