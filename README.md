# asl-choice-processor
[![Tymly Package](https://img.shields.io/badge/tymly-package-blue.svg)](https://tymly.io/) [![npm (scoped)](https://img.shields.io/npm/v/@wmfs/asl-choice-processor.svg)](https://www.npmjs.com/package/@wmfs/asl-choice-processor) [![CircleCI](https://circleci.com/gh/wmfs/asl-choice-processor.svg?style=svg)](https://circleci.com/gh/wmfs/asl-choice-processor) [![codecov](https://codecov.io/gh/wmfs/asl-choice-processor/branch/master/graph/badge.svg)](https://codecov.io/gh/wmfs/asl-choice-processor) [![CodeFactor](https://www.codefactor.io/repository/github/wmfs/asl-choice-processor/badge)](https://www.codefactor.io/repository/github/wmfs/asl-choice-processor) [![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/asl-choice-processor/blob/master/LICENSE)
> For determining the next state given an Amazon States Language "Choices" definition and a set of values. 

### Useful links

* [Amazon States Language specification (Apache License, Version 2.0)](https://states-language.net/spec.html#choice-state)
* [Choice](http://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html#amazon-states-language-choice-state-rules) state documentation

## <a name="install"></a>Install
```bash
$ npm install @wmfs/asl-choice-processor --save
```

## <a name="usage"></a>Usage
```javascript
const choiceProcessor = require('@wmfs/asl-choice-processor')

const calculateNextState = choiceProcessor({
  Choices: [
    {
      Variable: '$.foo',
      NumericEquals: 1,
      Next: 'FirstMatchState'
    },
    {
      And: [
        { Variable: '$.foo', NumericGreaterThan: 1 },
        { Not: { Variable: '$.bar', StringMatches: 'test-*' } }
      ],
      Next: 'SecondMatchState'
    }
  ],
  Default: 'DefaultMatchState'
})

calculateNextState({ foo: 1 }) // 'FirstMatchState'
calculateNextState({ foo: 2, bar: 'live' }) // 'SecondMatchState'
calculateNextState({ foo: 2, bar: 'test-1' }) // 'DefaultMatchState'
```

`choiceProcessor(definition)` validates the Choice state definition and returns a `calculateNextState(input[, context])` function. That function returns the `Next` of the first Choice Rule that matches, otherwise `Default`, otherwise `null`. (Statebox raises `States.NoChoiceMatched` when it gets `null`.)

`context` is an optional [Context Object](https://states-language.net/spec.html#context-object). Paths starting with `$$` are applied to it, and all other Paths are applied to `input`.

### Invalid definitions

Definitions are checked when `choiceProcessor()` is called, not when a state runs. An invalid one throws a `ChoiceDefinitionError` saying where the problem is:

```javascript
const { ChoiceDefinitionError } = require('@wmfs/asl-choice-processor')

choiceProcessor({ Choices: [{ Variable: '$.x', NumericEqual: 1, Next: 'A' }] })
// ChoiceDefinitionError: Invalid Choice state: Choices[0]: no comparison or boolean operator found (unrecognised: NumericEqual)
```

The checks include: a non-empty `Choices` array, `Next` on every top-level rule, exactly one operator per rule, `Variable` being a Path, comparison values of the right type, and `...Path` values being Paths.

## <a name="operators"></a>Supported operators

Everything in the [States Language Choice state spec](https://states-language.net/spec.html#choice-state) (JSONPath):

| Kind | Operators |
|---|---|
| Boolean | `And`, `Or`, `Not` (nested to any depth) |
| Numeric | `NumericEquals`, `NumericGreaterThan`, `NumericGreaterThanEquals`, `NumericLessThan`, `NumericLessThanEquals` |
| String | `StringEquals`, `StringGreaterThan`, `StringGreaterThanEquals`, `StringLessThan`, `StringLessThanEquals`, `StringMatches` |
| Timestamp | `TimestampEquals`, `TimestampGreaterThan`, `TimestampGreaterThanEquals`, `TimestampLessThan`, `TimestampLessThanEquals` |
| Boolean value | `BooleanEquals` |
| Type tests | `IsBoolean`, `IsNull`, `IsNumeric`, `IsPresent`, `IsString`, `IsTimestamp` |

Every comparison operator except `StringMatches` also has a `...Path` variant, e.g. `NumericLessThanPath: '$.limit'`, which compares against a value read from the input (or the context object, with `$$`).

### How values are compared

- **No type coercion:** a comparison only matches when both values are the right type. `NumericGreaterThan: 5` doesn't match `"10"`, `true` or `null`, and `StringEquals` doesn't match numbers.
- **Strings** are compared by Unicode code point.
- **Timestamps** must be RFC3339 with an uppercase `T` and `Z`, e.g. `2016-03-14T01:59:00Z` or `2016-03-14T02:59:00.5+01:00`. They're compared as points in time, so different offsets and trailing fractional zeros don't matter. A value that isn't a valid timestamp never matches.
- **`StringMatches`:** `*` matches any run of characters (including none). Use `\\*` in JSON for a literal `*`, and `\\\\` for a literal `\`.
- **Missing values:** a Path that matches nothing is treated as missing. Missing values fail every comparison, `IsPresent: true` and the other type tests. An explicit `null` is present.
- **`Next` on nested rules** (inside `And`, `Or` or `Not`) is ignored.

### Tymly extensions

These aren't part of the spec and are kept for compatibility:

| Operator | Matches when |
|---|---|
| `Includes` / `IncludesPath` | the input is an array containing the value (compared deeply) |
| `IsUndefined` | the opposite of `IsPresent` |
| `IsBooleanPath`, `IsNullPath`, `IsPresentPath`, `IsStringPath` and the other `Is...Path` operators | `...Path` variants of the type tests, where the boolean is read from the input |

### Not supported

JSONata Choice states (`QueryLanguage: "JSONata"` and `Condition` rules) are rejected with a `ChoiceDefinitionError`.

## <a name="upgrading"></a>Upgrading from 1.x

2.0 follows the States Language spec strictly:

- **Invalid definitions now fail when they're loaded**, with a `ChoiceDefinitionError`. Before, they quietly did something odd at runtime.
- **Comparisons no longer convert types.** A value of the wrong type no longer matches, so the execution moves on to the next rule or `Default`.

### Check your state machines

Run the checker over the folders that hold your state machine JSON files, e.g. a Tymly checkout:

```bash
npx -p @wmfs/asl-choice-processor@2 asl-choice-check ~/dev/tymly
```

It checks every Choice state, including those inside `Parallel` branches and `Map` iterators, and skips `node_modules`. It reports:

- **`ERROR`**: this definition fails to load on 2.0. Fix these before upgrading.
- **`REVIEW`**: this definition loads, but may take a different branch when a value isn't the expected type. Check what data actually reaches these rules.

It exits with code 1 if there are any errors, so you can run it in CI. It reports one error per Choice state at a time, so fix and re-run until it's clean.

### Fixing errors

| Error message contains | 1.x | Fix |
|---|---|---|
| `StringEquals must be a string, got null` | `"StringEquals": null` | `"IsNull": true` |
| `NumericEquals must be a number, got "5"` | `"NumericEquals": "5"` | `"NumericEquals": 5`. If the *input* is the string `"5"`, use `"StringEquals": "5"` instead. |
| `must be a boolean, got "true"` | `"IsPresent": "true"` | `"IsPresent": true` |
| `StringEquals must be a string, got false` | `"StringEquals": false` | `"BooleanEquals": false` |
| `must be an RFC3339 timestamp` | `"TimestampEquals": "2026-01-01"` | `"TimestampEquals": "2026-01-01T00:00:00Z"` |
| `unrecognised: …` | `"NumericEqual": 1` | Fix the operator name. See [Supported operators](#operators). |
| `only one operator is allowed per rule` | two operators in one rule | Split them with `And` |
| `top-level Choice Rules must have a Next` | a rule in `Choices` with no `Next` | Add `"Next"` |
| `Variable must be a Path starting with "$"` | `"Variable": "type"` | `"Variable": "$.type"` |
| `…Path must be a Path starting with "$"` | `"NumericEqualsPath": 5` | Use `"NumericEquals": 5` for a fixed value |

Every fix in the table also works on 1.x, so you can fix definitions before you upgrade.

### Checking `REVIEW` rules

- **`Numeric*`:** 1.x matched numeric strings, e.g. `"10"` was greater than `5`, and `null`, `false` and `[]` matched `NumericLessThan`. Now only numbers match. Save the value as a number, convert it in `Parameters` with `States.StringToJson`, or compare it with `StringEquals`.
- **`Timestamp*`:** values are compared as points in time, and anything that isn't a full RFC3339 timestamp never matches. `new Date().toISOString()` always produces a valid one.
- **`…Path` operators:** the value read from the input must be the right type too. For example, `StringEqualsPath` no longer matches `null` to `null` or missing to missing. If a rule compares a user's email with a record's, also check the email isn't blank, e.g. `{ "Variable": "$.email", "StringGreaterThan": "" }`, because `''` still equals `''`.

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/asl-choice-processor/blob/master/LICENSE)
