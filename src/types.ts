/**
 * Bristol log severity.
 */
export type BristolDefaultSeverity = 'debug' | 'info' | 'warn' | 'error'

/**
 * Stackdriver log severity.
 */
export type StackdriverSeverity =
  | 'DEFAULT'
  | 'DEBUG'
  | 'INFO'
  | 'NOTICE'
  | 'WARNING'
  | 'ERROR'
  | 'CRITICAL'
  | 'ALERT'
  | 'EMERGENCY'

/**
 * Stackdriver labels.
 */
export type StackdriverLabels = { [key: string]: string }

/**
 * Severity map.
 */
export type SeverityMap<T extends string> = Record<T, StackdriverSeverity>

/**
 * Options for the Stackdriver target.
 */
export interface StackdriverTargetOptions<S extends string> {
  /**
   * Log name in Stackdriver. Defaults to `default`
   */
  logName?: string
  /**
   * How often should we flush entries to Stackdriver?
   */
  writeInterval?: number
  /**
   * GCP Project ID.
   */
  projectId: string
  /**
   * Path to a gcloud credentials file. Leave blank if using `credentials`.
   */
  keyFilename?: string
  /**
   * Parsed keyfile JSON (plain JS object). Leave blank if using `keyfile`.
   */
  credentials?: object
  /**
   * Monitored resource to place the log under. Defaults to `global`.
   */
  resource?: MonitoredResource
  /**
   * Callback when entries get flushed.
   */
  onFlushed?: Function
  /**
   * Callback when flushing entries fail.
   */
  onFlushError?: Function
  /**
   * If specified, will include in JSON payload in order
   * to have Stackdriver Logging report errors
   * to Stackdriver Error Reporting.
   */
  serviceContext?: CloudServiceContext
  /**
   * If you override Bristol's default severities (`logger.setSeverities([...])`), pass in an object
   * that maps from your severities to Stackdriver ones.
   *
   * @example
   *   logger.setSeverities(['gameover', 'ohnoes', 'hmm', 'meh'])
   *   logger.addTarget(stackdriver.target({
   *     severityMap: {
   *       gameover: 'CRITICAL',
   *       ohnoes: 'ERROR',
   *       hmm: 'WARNING',
   *       meh: 'DEBUG'
   *     }
   *   })).withFormatter(stackdriver.formatter())
   */
  severityMap?: SeverityMap<S>
}

/**
 * GCP monitored resource.
 */
export interface MonitoredResource {
  type: string
  labels: StackdriverLabels
}

/**
 * Google Cloud Service Context. For use with Error Reporting.
 */
export interface CloudServiceContext {
  service: string
  version: string
}

/**
 * Formatter result.
 */
export interface FormatResult {
  error?: Error
  message?: string
  payload: any
  labels: StackdriverLabels
  file: string
  line: string
}

/**
 * Log records being buffered.
 */
export interface LogRecord {
  entry: FormatResult
  meta: LogRecordMetadata
}

/**
 * Log record metadata.
 */
export interface LogRecordMetadata {
  timestamp: Date
  severity: StackdriverSeverity
  labels: StackdriverLabels
  sourceLocation: SourceLocation
}

/**
 * Source location.
 */
export interface SourceLocation {
  file: string
  line: string
}
