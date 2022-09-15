'use strict'

module.exports = function isStringOperator (inputValue, comparisonValue, candidateStateName, cache) {
  const isString = typeof inputValue === 'string'

  if (isString && comparisonValue === true) {
    return candidateStateName
  }

  if (!isString && comparisonValue !== true) {
    return candidateStateName
  }
}
