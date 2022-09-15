module.exports = function isBooleanOperator (inputValue, comparisonValue, candidateStateName, cache) {
  const isBoolean = typeof inputValue === 'boolean'

  if (isBoolean && comparisonValue === true) {
    return candidateStateName
  }

  if (!isBoolean && comparisonValue !== true) {
    return candidateStateName
  }
}
