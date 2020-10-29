const operators = require('./operators')

module.exports = function findOperator (choice) {
  let operator
  let value
  let isPath = false

  Object.entries(choice).forEach(([k, v]) => {
    if (operator === undefined) {
      if (k.endsWith('Path')) {
        k = k.split('Path')[0]
        isPath = true
      }

      if (operators[k]) {
        operator = operators[k]
        value = v
      }
    }
  })

  return {
    operator,
    value,
    isPath
  }
}
