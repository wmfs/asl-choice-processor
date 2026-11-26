'use strict'

// StringMatches patterns: "*" matches zero or more characters. "\*" is a
// literal asterisk and "\\" a literal backslash (written "\\*" and "\\\\" in
// JSON text). Everything else matches itself.
// See https://states-language.net/spec.html#choice-state
function compilePattern (pattern) {
  let source = ''
  for (let i = 0; i < pattern.length; i++) {
    const ch = pattern[i]
    if (ch === '\\' && (pattern[i + 1] === '*' || pattern[i + 1] === '\\')) {
      source += escapeRegExp(pattern[++i])
    } else if (ch === '*') {
      source += '[\\s\\S]*'
    } else {
      source += escapeRegExp(ch)
    }
  }
  return new RegExp(`^${source}$`, 'u')
} // compilePattern

function escapeRegExp (s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

module.exports = compilePattern
