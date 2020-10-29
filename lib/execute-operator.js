const findOperator = require('./find-operator')

const isJSONPath = p => (p && typeof p.valueOf() === 'string') && p.length !== 0 && p[0] === '$'

module.exports = function executeOperator (choice, inputCache, values) {
  const operator = findOperator(choice)

  const inputValue = inputCache.get(choice.Variable, values)

  if (operator.isPath && isJSONPath(operator.value)) {
    operator.value = inputCache.get(operator.value, values)
  }

  return operator.operator(
    inputValue,
    operator.value,
    choice.Next,
    inputCache
  )
}
