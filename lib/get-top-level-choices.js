'use strict'

const _ = require('lodash')
const operators = require('./operators')

module.exports = function getTopLevelChoices (choices) {
  const topLevelChoices = []

  choices.forEach(choice => {
    // Find first operator
    let operator, operatorValue, operatorIsPath = false

    Object.entries(choice).forEach(([key, value]) => {
      if (operator === undefined) {
        if (key.endsWith('Path')) {
          key = key.split('Path')[0]
          operatorIsPath = true
        }

        if (operators[key]) {
          operator = operators[key]
          operatorValue = value
        }
      }
    })

    topLevelChoices.push({
      operator,
      operatorValue,
      operatorIsPath,
      definition: _.cloneDeep(choice)
    })
  })

  return topLevelChoices
}
