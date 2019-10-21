import throttle from 'lodash.throttle'
import {
  SeverityMap,
  BristolDefaultSeverity,
  StackdriverTargetOptions,
  FormatResult,
  LogRecordMetadata
} from './types'

// Logging library apparently not typed. ¯\_(ツ)_/¯
const { Logging } = require('@google-cloud/logging')
const destroyCircular = require('destroy-circular')

// Default monitored resource.
// https://cloud.google.com/logging/docs/reference/v2/rest/v2/MonitoredResource
const DEFAULT_RESOURCE = { labels: {}, type: 'global' }

// Bristol's default severities.
const DEFAULT_SEVERITY_MAP: SeverityMap<BristolDefaultSeverity> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR'
}

/**
 * Creates a Bristol target.
 * MUST be used with the accompanying formatter!
 */
export function target<S extends string = BristolDefaultSeverity>(
  opts: StackdriverTargetOptions<S>
) {
  let buffer: any[] = []
  const loggingClient = new Logging({
    projectId: opts.projectId,
    keyFilename: opts.keyFilename,
    credentials: opts.credentials,
    resource: opts.resource || DEFAULT_RESOURCE
  })
  const log = loggingClient.log(
    opts.logName /* istanbul ignore next */ || 'default'
  )

  // Batch & flush to Stackdriver every (default) 500ms.
  const flush = throttle(flushToStackdriver, opts.writeInterval || 500, {
    trailing: true
  })

  // If you are using custom severities in Bristol, you should
  // pass them in here so we can map them to Stackdriver severities.
  const severityMap: SeverityMap<any> = {
    ...DEFAULT_SEVERITY_MAP,
    ...(opts.severityMap || /* istanbul ignore next */ {})
  }

  /**
   * The actual target function.
   */
  return function stackdriverTarget(
    _opts: any,
    severity: S,
    date: Date,
    formatResult: FormatResult
  ) {
    const meta: LogRecordMetadata = {
      severity: severityMap[severity] /* istanbul ignore next */ || 'DEFAULT',
      timestamp: date,
      sourceLocation: {
        line: formatResult.line,
        file: formatResult.file
      },
      labels: {
        ...formatResult.labels
      }
    }
    const data = destroyCircular({
      ...formatResult.payload,
      eventTime: date.toISOString(),
      // By passing in a Service Context, Stackdriver Logging will automatically
      // report errors to Stackdriver Error Reporting. This happens server-side.
      serviceContext: opts.serviceContext,
      message: formatResult.message,
      context: {
        ...formatResult.payload.context,
        httpRequest: formatResult.httpContext,
        user: formatResult.user
      }
    })
    const entry = log.entry(meta, data)
    buffer.push(entry)
    flush()
  }

  /**
   * Flushes all collected entries to Stackdriver.
   */
  function flushToStackdriver() {
    Promise.resolve()
      .then(() => {
        const toFlush = buffer.concat()
        buffer = []
        return log.write(toFlush, { partialSuccess: true })
      })
      .then(
        opts.onFlushed as any,
        /* istanbul ignore next */
        (error: any) =>
          opts.onFlushError
            ? opts.onFlushError(error)
            : console.error(`Error flushing log entries to Stackdriver:`, error)
      )
  }
}
