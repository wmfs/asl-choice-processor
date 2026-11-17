#!/usr/bin/env node
// Checks every Choice state in the state machine JSON files under a folder
// against @wmfs/asl-choice-processor 2.x.
//   npx -p @wmfs/asl-choice-processor asl-choice-check <folder> [<folder> ...]
const fs = require('fs')
const path = require('path')
const choiceProcessor = require('../lib')

const REVIEW = [
  [/^Numeric/, 'only matches JSON numbers now - a numeric string like "10", null or a boolean goes to Default'],
  [/^Timestamp/, 'compares instants now - offsets/fractional seconds are respected, and values that are not RFC3339 timestamps go to Default'],
  [/^String(Greater|Less)/, 'only matches strings now - numbers, null and booleans go to Default'],
  [/Path$/, 'the value read from the input must also be the right type']
]

let errors = 0
let reviews = 0
let checked = 0

const roots = process.argv.slice(2)
if (roots.length === 0) {
  console.log('Usage: asl-choice-check <folder> [<folder> ...]')
  process.exit(2)
}
for (const root of roots) {
  if (!fs.existsSync(root)) {
    console.log(`No such file or folder: ${root}`)
    process.exit(2)
  }
  walk(root)
}

console.log(`\nChecked ${checked} Choice state(s): ${errors} error(s), ${reviews} rule(s) to review`)
process.exitCode = errors ? 1 : 0

function walk (p) {
  const stat = fs.statSync(p)
  if (stat.isDirectory()) {
    if (['node_modules', '.git', 'coverage'].includes(path.basename(p))) return
    for (const f of fs.readdirSync(p)) walk(path.join(p, f))
  } else if (p.endsWith('.json')) {
    let json
    try { json = JSON.parse(fs.readFileSync(p, 'utf8')) } catch (e) { return }
    if (isMachine(json)) checkMachine(p, json, '')
  }
}

function isObject (o) {
  return o !== null && typeof o === 'object' && !Array.isArray(o)
}

function isMachine (json) {
  return isObject(json) && typeof json.StartAt === 'string' && isObject(json.States)
}

function checkMachine (file, machine, prefix) {
  for (const [name, state] of Object.entries(machine.States)) {
    if (!isObject(state)) continue
    const where = `${file} > ${prefix}${name}`
    if (state.Type === 'Choice') checkChoice(where, state)
    if (Array.isArray(state.Branches)) {
      state.Branches.forEach((branch, i) => {
        if (isMachine(branch)) checkMachine(file, branch, `${prefix}${name}.Branches[${i}] > `)
      })
    }
    const inner = state.ItemProcessor || state.Iterator
    if (isMachine(inner)) checkMachine(file, inner, `${prefix}${name}.${state.ItemProcessor ? 'ItemProcessor' : 'Iterator'} > `)
  }
}

function checkChoice (where, state) {
  checked++
  try {
    choiceProcessor(state)
  } catch (e) {
    errors++
    console.log(`ERROR   ${where}\n        ${e.message}`)
    return
  }
  for (const [i, rule] of state.Choices.entries()) reviewRule(where, rule, `Choices[${i}]`)
}

function reviewRule (where, rule, location) {
  if (!rule || typeof rule !== 'object') return
  for (const op of ['And', 'Or']) (rule[op] || []).forEach((r, i) => reviewRule(where, r, `${location}.${op}[${i}]`))
  if (rule.Not) reviewRule(where, rule.Not, `${location}.Not`)
  for (const key of Object.keys(rule)) {
    const reasons = REVIEW.filter(([re]) => re.test(key)).map(([, why]) => why)
    if (reasons.length) {
      reviews++
      console.log(`REVIEW  ${where} ${location}: ${rule.Variable} ${key} ${JSON.stringify(rule[key])}\n        ${reasons.join('; ')}`)
    }
  }
}
