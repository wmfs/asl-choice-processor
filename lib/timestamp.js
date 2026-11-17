'use strict'

// Timestamps in the States Language are RFC3339 strings, with an uppercase
// "T" between date and time and an uppercase "Z" when there's no numeric
// offset, e.g. "2016-03-14T01:59:00Z" or "2016-03-14T02:59:00.25+01:00".
// See https://states-language.net/spec.html#timestamps
const RFC3339 = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(?:Z|([+-])(\d{2}):(\d{2}))$/

// Parses a timestamp into { seconds, fraction } where seconds is whole
// seconds since the epoch (UTC) and fraction is the fractional-second digits,
// kept as a string so precision beyond milliseconds isn't lost.
// Returns null if the value isn't a valid timestamp.
function parseTimestamp (value) {
  if (typeof value !== 'string') return null

  const m = RFC3339.exec(value)
  if (!m) return null

  const [year, month, day, hour, minute, second] = m.slice(1, 7).map(Number)
  const fraction = (m[7] || '').replace(/0+$/, '')
  const sign = m[8] === '-' ? -1 : 1
  const offsetHours = m[9] ? Number(m[9]) : 0
  const offsetMinutes = m[10] ? Number(m[10]) : 0

  if (month < 1 || month > 12) return null
  if (hour > 23 || minute > 59 || second > 59) return null
  if (offsetHours > 23 || offsetMinutes > 59) return null

  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(hour, minute, second, 0)
  // Reject dates that rolled over, e.g. 2021-02-30
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null

  const offsetSeconds = sign * (offsetHours * 3600 + offsetMinutes * 60)
  return {
    seconds: date.getTime() / 1000 - offsetSeconds,
    fraction
  }
} // parseTimestamp

// Compares two parsed timestamps: negative, zero or positive
function compareTimestamps (a, b) {
  if (a.seconds !== b.seconds) return a.seconds < b.seconds ? -1 : 1
  const length = Math.max(a.fraction.length, b.fraction.length)
  const fa = a.fraction.padEnd(length, '0')
  const fb = b.fraction.padEnd(length, '0')
  if (fa === fb) return 0
  return fa < fb ? -1 : 1
} // compareTimestamps

module.exports = { parseTimestamp, compareTimestamps }
