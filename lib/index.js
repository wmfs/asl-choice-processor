'use strict'

const { compileChoices, ChoiceDefinitionError } = require('./compile')
const InputValueCache = require('./Input-value-cache')

// Creates a function that works out the next state for a Choice state.
// The definition is validated up front, and an invalid one throws a
// ChoiceDefinitionError.
//
//   const calculateNextState = choiceProcessor({ Choices: [...], Default: '...' })
//   calculateNextState(input[, context])
//
// Returns the Next of the first matching Choice Rule, else Default, else null.
// context is the optional Context Object that "$$" Paths are applied to.
function choiceProcessor (definition) {
  const rules = compileChoices(definition)
  const defaultState = definition.Default || null

  return function calculateNextState (input, context) {
    const resolver = new InputValueCache(input, context)

    for (const rule of rules) {
      if (rule.test(resolver)) return rule.next
    }

    return defaultState
  } // calculateNextState
} // choiceProcessor

module.exports = choiceProcessor
module.exports.ChoiceDefinitionError = ChoiceDefinitionError
