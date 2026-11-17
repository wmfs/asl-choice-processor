'use strict'

const comparisons = require('./comparisons')
const typeTests = require('./type-tests')
const extensions = require('./extensions')

// Operators whose comparison value must be a boolean
const TYPE_TESTS = new Set([...Object.keys(typeTests), 'IsUndefined'])

// Operators that also have a "...Path" variant, where the comparison value is
// read from the input. The spec defines Path variants for the comparison
// operators; the type tests and Includes accept them too for compatibility.
const PATH_VARIANTS = new Set([
  ...Object.keys(comparisons),
  ...Object.keys(typeTests),
  ...Object.keys(extensions)
])

module.exports = {
  ...comparisons,
  ...typeTests,
  ...extensions,
  TYPE_TESTS,
  PATH_VARIANTS
}
