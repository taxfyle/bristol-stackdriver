import * as stackdriver from '../'
import { ReplaySubject, Observable } from 'rxjs'
import { getEnv } from './env'
import { v4 } from 'uuid'

jest.setTimeout(30000)

const { Bristol } = require('bristol')
const Logging = require('@google-cloud/logging')

const logName = 'test__bristol-stackdriver'
const env = getEnv()
const gcloudOpts = {
  credentials: JSON.parse(env.GCLOUD_CREDENTIALS),
  projectId: env.GCLOUD_PROJECT,
  serviceContext: {
    service: 'bristol-stackdriver',
    version: '0.0.0'
  }
}

const loggingClient = new Logging(gcloudOpts)

describe('target', () => {
  it('writes to Stackdriver log', async () => {
    const logger = new Bristol()
    // Use Rx to make it easier to wait for flushes.
    const flush$ = new ReplaySubject()
    const severityMap: stackdriver.SeverityMap<any> = {
      meh: 'DEBUG',
      oh: 'INFO',
      hey: 'NOTICE',
      hmm: 'WARNING',
      damn: 'ERROR',
      fuck: 'CRITICAL',
      help: 'ALERT',
      bye: 'EMERGENCY'
    }
    logger
      .addTarget(
        createTarget({
          severityMap,
          onFlushed: flush$.next.bind(flush$),
          onFlushError: flush$.error.bind(flush$)
        })
      )
      .withFormatter(stackdriver.formatter())
    logger.setSeverities(Object.keys(severityMap).reverse())
    const uid = v4()
    const errorToReport = new Error('oh no: ' + uid)

    logger.meh('Debug test ' + uid, { a: 1, b: 2 }, true)
    logger.oh('Info test' + uid, {
      c: 1,
      d: 2,
      'sd:labels': { isTest: 'yeah boi' }
    })
    logger.damn('Error test' + uid, errorToReport)
    logger.fuck('Critical test' + uid)
    logger.help('Alert test' + uid)
    logger.bye('Emergency test' + uid)
    logger.bye(errorToReport)

    await flush$.first().toPromise()

    const logEntries = await getLogsWithUid(uid)

    const findEntry = (severity: stackdriver.StackdriverSeverity) =>
      logEntries.find((e: any) => e && e.metadata.severity === severity)
    const debugEntry = findEntry('DEBUG')
    const infoEntry = findEntry('INFO')
    const errorEntry = findEntry('ERROR')

    expect(debugEntry.data.message).toContain('Debug test')
    expect(debugEntry.data.a).toBe(1)
    expect(debugEntry.data.b).toBe(2)

    expect(infoEntry.data.message).toContain('Info test')
    expect(infoEntry.data.c).toBe(1)
    expect(infoEntry.data.d).toBe(2)
    expect(infoEntry.metadata.labels).toEqual({ isTest: 'yeah boi' })

    expect(errorEntry.data.message).toContain('Error test')
    expect(errorEntry.data.message).toContain(errorToReport.message)
    expect(errorEntry.data.message).toContain(errorToReport.stack)

    expect(findEntry('CRITICAL')).toBeDefined()
    expect(findEntry('ALERT')).toBeDefined()
    expect(findEntry('EMERGENCY')).toBeDefined()
  })

  /**
   * Uses Rx to poll for the log entries that contain the specified uid
   *
   * @param uid
   */
  function getLogsWithUid(uid: string) {
    const predicate = (e: any) => e.data.message.includes(uid)
    return Observable.interval(2000)
      .flatMap(() =>
        loggingClient
          .log(logName)
          .getEntries({ pageSize: 100, orderBy: 'timestamp desc' })
          .then(([entries]: any) => entries)
      )
      .map((entries: any) => entries.filter(predicate))
      .first((entries: any) => entries.length > 0)
      .toPromise()
  }

  function createTarget<S extends string = stackdriver.BristolDefaultSeverity>(
    opts: Partial<stackdriver.StackdriverTargetOptions<S>>
  ) {
    return stackdriver.target({
      ...opts,
      ...gcloudOpts,
      logName
    })
  }
})
