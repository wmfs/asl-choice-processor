'use strict'

const jp = require('jsonpath')

class InputValueCache {
  constructor () {
    this.cache = {}
  }

  get (inputPath, values) {
    if (!values) { return null }

    if (this.cache.hasOwnProperty(inputPath)) {
      return this.cache[inputPath]
    }

    let value = jp.query(values, inputPath)

    if (Array.isArray(value)) {
      const l = value.length
      switch (l) {
        case 0:
          value = undefined
          break
        case 1:
          value = value[0]
          break
      }
    }
    this.cache[inputPath] = value
    return value
  }
} // get

module.exports = InputValueCache
