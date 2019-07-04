# asl-choice-processor
[![Tymly Package](https://img.shields.io/badge/tymly-package-blue.svg)](https://tymly.io/) [![npm (scoped)](https://img.shields.io/npm/v/@wmfs/asl-choice-processor.svg)](https://www.npmjs.com/package/@wmfs/asl-choice-processor) [![CircleCI](https://circleci.com/gh/wmfs/asl-choice-processor.svg?style=svg)](https://circleci.com/gh/wmfs/asl-choice-processor) [![codecov](https://codecov.io/gh/wmfs/asl-choice-processor/branch/master/graph/badge.svg)](https://codecov.io/gh/wmfs/asl-choice-processor) [![CodeFactor](https://www.codefactor.io/repository/github/wmfs/asl-choice-processor/badge)](https://www.codefactor.io/repository/github/wmfs/asl-choice-processor) [![Dependabot badge](https://img.shields.io/badge/Dependabot-active-brightgreen.svg)](https://dependabot.com/) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com) [![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/wmfs/tymly/blob/master/packages/pg-concat/LICENSE)
> For determining the next state given an Amazon States Language "Choices" definition and a set of values. 

### Useful links

* [Amazon States Language specification (Apache License, Version 2.0)](https://states-language.net/spec.html#choice-state)
* [Choice](http://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html#amazon-states-language-choice-state-rules) state documentation

## <a name="install"></a>Install
```bash
$ npm install asl-choice-processor --save
```

## <a name="usage"></a>Usage
```javascript
const choiceProcessor = require('asl-choice-processor')
const calculateNextState = choiceProcessor(
  {
    Choices: [
      {
        Variable: '$.foo',
        NumericEquals: 1,
        Next: 'FirstMatchState'
      },
      {
        Variable: '$.foo',
        NumericEquals: 2,
        Next: 'SecondMatchState'
      }
    ],
    Default: 'DefaultMatchState'
  }
)

calculateNextState( {foo: 1} ) // FirstMatchState
calculateNextState( {foo: 2} ) // SecondMatchState
calculateNextState( {foo: 3} ) // DefaultMatchState
```

## <a name="tests"></a>Tests
```bash
$ npm test
```

## <a name="license"></a>License
[MIT](https://github.com/wmfs/tymly/packages/asl-choice-processor/blob/master/LICENSE)
