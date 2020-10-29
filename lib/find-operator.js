const operators = require('./operators')

module.exports = function findOperator (choice) {
  let fn
  let value
  let isPath = false

  Object.entries(choice).forEach(([k, v]) => {
    if (fn === undefined) {
      if (k.endsWith('Path')) {
        k = k.split('Path')[0]
        isPath = true
      }

      if (operators[k]) {
        fn = operators[k]
        value = v
      }
    }
  })

  return {
    fn,
    value,
    isPath
  }
}
