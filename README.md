# [Stackdriver][stackdriver] target + formatter for [Bristol][bristol]

[![npm](https://img.shields.io/npm/v/bristol-stackdriver.svg?maxAge=1000)](https://www.npmjs.com/package/bristol-stackdriver)
[![dependency Status](https://img.shields.io/david/taxfyle/bristol-stackdriver.svg?maxAge=1000)](https://david-dm.org/taxfyle/bristol-stackdriver)
[![devDependency Status](https://img.shields.io/david/dev/taxfyle/bristol-stackdriver.svg?maxAge=1000)](https://david-dm.org/taxfyle/bristol-stackdriver)
[![Build Status](https://img.shields.io/travis/taxfyle/bristol-stackdriver.svg?maxAge=1000)](https://travis-ci.org/taxfyle/bristol-stackdriver)
[![Coveralls](https://img.shields.io/coveralls/taxfyle/bristol-stackdriver.svg?maxAge=1000)](https://coveralls.io/github/taxfyle/bristol-stackdriver)
[![npm](https://img.shields.io/npm/dt/bristol-stackdriver.svg?maxAge=1000)](https://www.npmjs.com/package/bristol-stackdriver)
[![npm](https://img.shields.io/npm/l/bristol-stackdriver.svg?maxAge=1000)](https://github.com/taxfyle/bristol-stackdriver/blob/master/LICENSE.md)

This package provides a Bristol target + formatter that sends logs to Google Cloud Stackdriver.

# Install

With `npm`:

```
npm install bristol-stackdriver
```

Or with `yarn`

```
yarn add bristol-stackdriver
```

# Usage

Import the `target` and `formatter` and add them to your Bristol instance.

```js
import Bristol from 'bristol'
import * as stackdriver from 'bristol-stackdriver'

const logger = new Bristol()
logger.withFormatter(stackdriver.formatter())

logger.info('Hello Stackdriver!', { shoop: 'da whoop' })
logger.error('Uh-oh', new Error('best check me out'))
```

# API

`bristol-stackdriver` has a few tricks up its' sleeve. _The examples only present relevant configuration changes for brevity._

## Adding labels to log entries

Stackdriver supports labels. To add labels to your log messages, use the `sd:labels` field when logging.

```js
logger.info('Starting flux capacitor', {
  'sd:labels': { phase: 'startup', module: 'flux-capacitor' }
})
logger.info('Starting reactor', {
  'sd:labels': { phase: 'startup', module: 'reactor' }
})

logger.error(
  'Reactor meltdown!!!1111ONEONEONE',
  new Error('core temp too high'),
  {
    'sd:labels': { module: 'reactor' }
  }
)
```

## Reporting errors to [Stackdriver Error Reporting][stackdriver-errors]

### Attaching `user` and `httpContext` for Error Reporting

Error Reporting can show request/response information about an error, as well as the ID of the user.

In order for the transport to submit that info, you need to attach it using `sd:req`, `sd:res` (or `sd:httpContext`) and `sd:user`.

```js
http.createServer((req, res) => {
  res.statusCode = 400
  logger.error(new Error('Go away'), {
    'sd:req': req,
    'sd:res': res,
    'sd:user': req.user.id
  })
})
```

Alternatively, if you want to specify the [HTTP context][http-context] yourself.

```js
http.createServer((req, res) => {
  res.statusCode = 400
  logger.error(new Error('Go away'), {
    'sd:httpContext': {
      method: req.method
      /* ... */
    }
  })
})
```

**In fact**, using `sd:req` and `sd:res` is the exact same as doing:

```js
import { collectHttpContext } from 'bristol-stackdriver'

logger.error(new Error('Go away'), {
  'sd:httpContext': collectHttpContext(req, res)
})
```

# Contributing

**You will need a Google Cloud Project ID + keyfile to run the tests!**

You can either add the project ID + keyfile (JSON stringified) to your own environment (`GCLOUD_PROJECT=your-project-id GCLOUD_CREDENTIALS="{\"type\": \"...\"}"`), or you can create an `env.yaml` in the repository root, and add the following:

```yaml
test:
  GCLOUD_PROJECT: your-project-id
  GCLOUD_CREDENTIALS: >
    {
      "type": "...",
      <..remaining key...>
    }
```

# Authors

Taxfyle Engineering — [@taxfyle](https://twitter.com/taxfyle)

<small>Or, more specifically, [this handsome devil](https://twitter.com/jeffijoe). This is the guy to complain to if stuff isn't working.</small>

[stackdriver]: https://cloud.google.com/logging/
[stackdriver-errors]: https://cloud.google.com/error-reporting
[bristol]: https://github.com/TomFrost/bristol
[http-context]: https://cloud.google.com/error-reporting/reference/rest/v1beta1/ErrorContext#HttpRequestContext
