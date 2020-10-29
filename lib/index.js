'use strict'

const InputValueCache = require('./Input-value-cache')
const executeOperator = require('./execute-operator')

module.exports = function (definition) {
  return function calculateNextState (values) {
    const inputCache = new InputValueCache()

    for (const choice of definition.Choices) {
      if (choice.Not) {
        const nextState = executeOperator({ ...choice.Not, Next: choice.Next }, inputCache, values)

        if (!nextState) return choice.Next
      } else if (choice.And || choice.Or) {
        const allChoices = choice.And || choice.Or
        const allNextStates = allChoices.map(c => executeOperator({ ...c, Next: choice.Next }, inputCache, values))

        if (choice.And) {
          const allEqual = arr => arr.every(v => v === arr[0])

          if (allEqual(allNextStates) && allNextStates[0] === choice.Next) {
            return choice.Next
          }
        } else if (choice.Or) {
          if (allNextStates.includes(choice.Next)) {
            return choice.Next
          }
        }
      } else {
        const nextState = executeOperator(choice, inputCache, values)

        if (nextState) return nextState
      }
    }

    return definition.Default ? definition.Default : null
  } // calculateNextState
} //
