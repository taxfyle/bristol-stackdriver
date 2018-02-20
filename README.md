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

Todo...

# Contributing

**You will need a Google Cloud Project ID + keyfile to run the tests!**

You can either add the project ID + keyfile (JSON stringified) it to your own environment (`GCLOUD_PROJECT=your-project-id GCLOUD_CREDENTIALS="{\"type\": \"...\"}"`), or you can create an `env.yaml` in the repository root, and add the following:

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

[stackdriver]: https://cloud.google.com/logging/
[bristol]: https://github.com/TomFrost/bristol
