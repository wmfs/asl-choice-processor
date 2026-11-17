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

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/asl-choice-processor/blob/master/LICENSE)
