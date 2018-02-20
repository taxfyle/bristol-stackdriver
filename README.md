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
logger
  .addTarget(
    stackdriver.target({
      // Name your log if you want.
      logName: 'default',
      // How often should we flush logs to Stackdriver? (milliseconds)
      writeInterval: 500,
      // If you want to have the logs be grouped under a specific resource.
      resource: {
        type: 'global',
        labels: {}
      },
      // Key filename.
      keyFilename: 'path/to/keyfile.json',
      // Alternatively, pass in the credentials directly.
      credentials: require('path/to/keyfile.json'),
      // Google Cloud Project ID
      projectId: 'my-gcloud-project',
      // Service context for reporting errors to Stackdriver Error Reporting.
      // This is optional; if you don't care then don't include the `serviceContext`.
      serviceContext: {
        service: require('package.json').name,
        version: require('package.json').version
      }
    })
  )
  .withFormatter(stackdriver.formatter())

logger.info('Hello Stackdriver!', { shoop: 'da whoop' })
logger.error('Uh-oh', new Error('best check me out'))
```

# API

`bristol-stackdriver` has a few tricks up its' sleeve. _The examples only present relevant configuration changes for brevity._

## Custom severities

Bristol allows you to customize your severities. The Stackdriver target needs to know how to map them to Stackdriver-specific severities.

You are not required to use/map them all, but those which are not mapped will be logged as `DEFAULT`.

```js
logger.setSeverities(['panic', 'ohno', 'hmm', 'cool', 'whatever'])
logger.addTarget(
  stackdriver.target({
    severityMap: {
      panic: 'EMERGENCY',
      ohno: 'ERROR',
      hmm: 'WARNING',
      cool: 'INFO',
      whatever: 'DEBUG'
    }
  })
)

// Gets logged to Stackdriver as `EMERGENCY`.
logger.panic('i can see the light', new Error('good bye'))
```

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

If you configure the target with a `serviceContext`, whenever an `Error` gets logged Stackdriver will automatically send it to Error Reporting.

```js
logger.addTarget(
  stackdriver.target({
    serviceContext: {
      service: require('package.json').name,
      version: require('package.json').version
    }
  })
)

logger.error(
  'well looks like I dum diddely darn done goofed',
  new Error('ya done goofed')
)
```

## Callbacks when flushing to Stackdriver (fails)

If you want to (for whatever reason) know when the target flushes to Stackdriver—or when it fails—you can attach some callbacks.

```js
logger.addTarget(
  stackdriver.target({
    onFlushed: () => console.log('flushed to stackdriver'),
    onFlushError: err => console.error('flushing to stackdriver failed', err)
  })
)
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
