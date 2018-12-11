'use strict'

const InputValueCache = require('./Input-value-cache')
const getTopLevelChoices = require('./get-top-level-choices')

module.exports = function (definition) {
  const choices = getTopLevelChoices(definition.Choices)

  return function calculateNextState (values) {
    const inputCache = new InputValueCache()
    for (const choice of choices) {
      const inputValue = inputCache.get(choice.definition.Variable, values)
      const nextState = choice.operator(
        inputValue,
        choice.operatorValue,
        choice.definition.Next,
        inputCache
      )

      if (nextState) return nextState
    }

    return definition.Default ? definition.Default : null
  } // calculateNextState
} //
