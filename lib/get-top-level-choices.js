'use strict'

const _ = require('lodash')
const operators = require('./operators')

module.exports = function getTopLevelChoices (choicesDefinition) {
  const topLevelChoices = []

  choicesDefinition.forEach(choiceDefinition => {
      // Find first operator
      let operator, operatorValue
      _.forOwn(choiceDefinition, (value, key) => {
        if (_.isUndefined(operator)) {
          if (operators.hasOwnProperty(key)) {
            operator = operators[key]
            operatorValue = value
          }
        }
      })

      topLevelChoices.push({
        operator: operator,
        operatorValue: operatorValue,
        definition: _.cloneDeep(choiceDefinition)
      })
    }
  )
  return topLevelChoices
}
