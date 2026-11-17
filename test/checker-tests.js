/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
const fs = require('fs')
const os = require('os')
const path = require('path')
const { spawnSync } = require('child_process')

const CHECKER = path.join(__dirname, '..', 'cli', 'check-choice-states.js')
const FIXTURES = path.join(__dirname, 'fixtures', 'checker')

function check (...args) {
  const { status, stdout } = spawnSync(process.execPath, [CHECKER, ...args], { encoding: 'utf8' })
  return { status, stdout }
}

describe('asl-choice-check', () => {
  it('reports every invalid Choice state, including inside Parallel and Map, and exits 1', () => {
    const { status, stdout } = check(path.join(FIXTURES, 'blueprint'))
    expect(status).to.equal(1)
    expect(stdout).to.include('bad.json > P.Branches[0] > Inner')
    expect(stdout).to.include('StringEquals must be a string, got null')
    expect(stdout).to.include('bad.json > M.Iterator > IC')
    expect(stdout).to.include('NumericEquals must be a number, got "5"')
    expect(stdout).to.include('IsPresent must be a boolean, got "true"')
    expect(stdout).to.include('bad2.json > C')
    expect(stdout).to.include('unrecognised: NumericEqual')
    expect(stdout).to.include('Checked 5 Choice state(s): 4 error(s), 2 rule(s) to review')
  })

  it('lists rules to review, and exits 0 when there are no errors', () => {
    const { status, stdout } = check(path.join(FIXTURES, 'clean'))
    expect(status).to.equal(0)
    expect(stdout).to.include('REVIEW')
    expect(stdout).to.include('$.n NumericGreaterThan 10')
    expect(stdout).to.include('TimestampLessThanPath "$$.Execution.StartTime"')
    expect(stdout).to.include('Checked 1 Choice state(s): 0 error(s), 2 rule(s) to review')
  })

  it('skips node_modules', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'asl-choice-check-'))
    const pkg = path.join(dir, 'node_modules', 'some-package')
    fs.mkdirSync(pkg, { recursive: true })
    fs.writeFileSync(path.join(pkg, 'bad.json'), JSON.stringify({
      StartAt: 'C',
      States: { C: { Type: 'Choice', Choices: [{ Variable: '$.x', NumericEqual: 1, Next: 'A' }] } }
    }))
    const { status, stdout } = check(dir)
    fs.rmSync(dir, { recursive: true, force: true })
    expect(status).to.equal(0)
    expect(stdout).to.include('Checked 0 Choice state(s)')
  })

  it('prints usage with no folders', () => {
    const { status, stdout } = check()
    expect(status).to.equal(2)
    expect(stdout).to.include('Usage: asl-choice-check')
  })

  it('reports a missing folder', () => {
    const { status, stdout } = check(path.join(FIXTURES, 'does-not-exist'))
    expect(status).to.equal(2)
    expect(stdout).to.include('No such file or folder')
  })
})
