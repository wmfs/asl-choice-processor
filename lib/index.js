'use strict'

const InputValueCache = require('./Input-value-cache')
const getTopLevelChoices = require('./get-top-level-choices')
const isJSONPath = p => (p && typeof p.valueOf() === 'string') && p.length !== 0 && p[0] === '$'

module.exports = function (definition) {
  const choices = getTopLevelChoices(definition.Choices)

  return function calculateNextState (values) {
    const inputCache = new InputValueCache()

    for (const choice of choices) {
      const inputValue = inputCache.get(choice.definition.Variable, values)

      if (choice.operatorIsPath && isJSONPath(choice.operatorValue)) {
        choice.operatorValue = inputCache.get(choice.operatorValue, values)
      }

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
