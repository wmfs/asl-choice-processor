'use strict'

const isNumber = v => typeof v === 'number' && !Number.isNaN(v)
const isString = v => typeof v === 'string'
const isBoolean = v => typeof v === 'boolean'

// Compares strings by Unicode code point, as the spec requires. (JavaScript's
// < and > compare UTF-16 code units, which differ for characters outside the
// Basic Multilingual Plane.)
function compareStrings (a, b) {
  if (a === b) return 0
  const ia = a[Symbol.iterator]()
  const ib = b[Symbol.iterator]()
  for (;;) {
    const ca = ia.next()
    const cb = ib.next()
    if (ca.done || cb.done) return ca.done ? (cb.done ? 0 : -1) : 1
    const pa = ca.value.codePointAt(0)
    const pb = cb.value.codePointAt(0)
    if (pa !== pb) return pa < pb ? -1 : 1
  }
} // compareStrings

module.exports = { isNumber, isString, isBoolean, compareStrings }
