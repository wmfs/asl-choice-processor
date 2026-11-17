'use strict'

// Validates a Choice state definition and compiles each Choice Rule into a
// test function, once, when the processor is created.
// See https://states-language.net/spec.html#choice-state
const operators = require('./operators')
const compilePattern = require('./string-matches')
const { parseTimestamp } = require('./timestamp')
const { isNumber, isString, isBoolean } = require('./operators/guards')

const BOOLEAN_OPERATORS = ['And', 'Or', 'Not']

// What each operator's comparison value must look like
const VALUE_CHECKS = [
  [/^Numeric/, isNumber, 'a number'],
  [/^String/, isString, 'a string'],
  [/^Timestamp/, v => parseTimestamp(v) !== null, 'an RFC3339 timestamp, e.g. "2016-03-14T01:59:00Z"'],
  [/^BooleanEquals$/, isBoolean, 'a boolean'],
  [/^Is/, isBoolean, 'a boolean']
]

class ChoiceDefinitionError extends Error {
  constructor (location, message) {
    super(`Invalid Choice state: ${location ? location + ': ' : ''}${message}`)
    this.name = 'ChoiceDefinitionError'
  }
}

function compileChoices (definition) {
  if (!isPlainObject(definition)) {
    throw new ChoiceDefinitionError('', 'definition must be an object')
  }
  if (definition.QueryLanguage === 'JSONata') {
    throw new ChoiceDefinitionError('', 'JSONata Choice states (Condition rules) are not supported')
  }
  const { Choices, Default } = definition
  if (!Array.isArray(Choices) || Choices.length === 0) {
    throw new ChoiceDefinitionError('Choices', 'must be a non-empty array')
  }
  if (Default !== undefined && Default !== null && !isNonEmptyString(Default)) {
    throw new ChoiceDefinitionError('Default', 'must be a state name')
  }

  return Choices.map((rule, i) => {
    const location = `Choices[${i}]`
    if (isPlainObject(rule) && !isNonEmptyString(rule.Next)) {
      throw new ChoiceDefinitionError(location, 'top-level Choice Rules must have a Next state name')
    }
    return {
      test: compileRule(rule, location),
      next: rule.Next
    }
  })
} // compileChoices

function compileRule (rule, location) {
  if (!isPlainObject(rule)) {
    throw new ChoiceDefinitionError(location, 'a Choice Rule must be an object')
  }
  if (rule.Condition !== undefined) {
    throw new ChoiceDefinitionError(location, 'JSONata Condition rules are not supported')
  }

  const ruleOperators = Object.keys(rule).filter(isOperatorName)
  if (ruleOperators.length === 0) {
    const unknown = Object.keys(rule).filter(k => !['Variable', 'Next', 'Comment'].includes(k))
    const hint = unknown.length ? ` (unrecognised: ${unknown.join(', ')})` : ''
    throw new ChoiceDefinitionError(location, `no comparison or boolean operator found${hint}`)
  }
  if (ruleOperators.length > 1) {
    throw new ChoiceDefinitionError(location, `only one operator is allowed per rule, found ${ruleOperators.join(', ')}`)
  }

  const operatorName = ruleOperators[0]
  const value = rule[operatorName]

  switch (operatorName) {
    case 'And':
    case 'Or': {
      if (!Array.isArray(value) || value.length === 0) {
        throw new ChoiceDefinitionError(`${location}.${operatorName}`, 'must be a non-empty array of Choice Rules')
      }
      const tests = value.map((r, i) => compileRule(r, `${location}.${operatorName}[${i}]`))
      return operatorName === 'And'
        ? resolver => tests.every(t => t(resolver))
        : resolver => tests.some(t => t(resolver))
    }
    case 'Not': {
      const test = compileRule(value, `${location}.Not`)
      return resolver => !test(resolver)
    }
    default:
      return compileComparison(rule, operatorName, value, location)
  }
} // compileRule

function compileComparison (rule, operatorName, value, location) {
  const variable = rule.Variable
  if (!isPath(variable)) {
    throw new ChoiceDefinitionError(location, `Variable must be a Path starting with "$", got ${JSON.stringify(variable)}`)
  }

  const isPathVariant = !operators[operatorName] && operatorName.endsWith('Path')
  const baseName = isPathVariant ? operatorName.slice(0, -'Path'.length) : operatorName

  if (isPathVariant) {
    if (!isPath(value)) {
      throw new ChoiceDefinitionError(location, `${operatorName} must be a Path starting with "$", got ${JSON.stringify(value)}`)
    }
  } else {
    checkComparisonValue(baseName, value, location)
  }

  const fn = baseName === 'StringMatches' ? stringMatches(value) : operators[baseName]

  return isPathVariant
    ? resolver => fn(resolver.get(variable), resolver.get(value))
    : resolver => fn(resolver.get(variable), value)
} // compileComparison

function stringMatches (pattern) {
  const regex = compilePattern(pattern)
  return input => typeof input === 'string' && regex.test(input)
}

function checkComparisonValue (operatorName, value, location) {
  for (const [match, check, description] of VALUE_CHECKS) {
    if (match.test(operatorName)) {
      if (!check(value)) {
        throw new ChoiceDefinitionError(location, `${operatorName} must be ${description}, got ${JSON.stringify(value)}`)
      }
      return
    }
  }
} // checkComparisonValue

function isOperatorName (key) {
  if (BOOLEAN_OPERATORS.includes(key) || key === 'StringMatches') return true
  if (isComparisonOperator(key)) return true
  return key.endsWith('Path') && operators.PATH_VARIANTS.has(key.slice(0, -'Path'.length))
}

function isComparisonOperator (key) {
  return typeof operators[key] === 'function'
}

const isPath = v => typeof v === 'string' && v.startsWith('$')
const isNonEmptyString = v => typeof v === 'string' && v.length > 0
const isPlainObject = v => v !== null && typeof v === 'object' && !Array.isArray(v)

module.exports = { compileChoices, ChoiceDefinitionError }
