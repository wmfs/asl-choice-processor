'use strict'

const {JSONPath} = require('jsonpath-plus');

class InputValueCache {
  constructor () {
    this.cache = {}
  }

  get (inputPath, values) {
    if (!values) { return null }

    if (Object.prototype.hasOwnProperty.call(this.cache, inputPath)) {
      return this.cache[inputPath]
    }

    let value = JSONPath({path: inputPath, json: values, wrap: false})

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
