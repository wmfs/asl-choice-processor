'use strict'

const jp = require('jsonpath')

// Resolves (and caches) Paths for one evaluation of the Choices.
// Paths starting "$$" are applied to the context object (with the first "$"
// removed); all other Paths are applied to the input.
// A Path that matches nothing resolves to undefined.
class InputValueCache {
  constructor (input, context) {
    this.input = input
    this.context = context
    this.cache = new Map()
  }

  get (path) {
    if (this.cache.has(path)) return this.cache.get(path)

    const value = path.startsWith('$$')
      ? query(this.context, path.slice(1))
      : query(this.input, path)

    this.cache.set(path, value)
    return value
  } // get
} // class InputValueCache

function query (data, path) {
  if (path === '$') return data
  if (data === null || typeof data !== 'object') return undefined

  const values = jp.query(data, path)
  switch (values.length) {
    case 0: return undefined
    case 1: return values[0]
    default: return values
  }
} // query

module.exports = InputValueCache
