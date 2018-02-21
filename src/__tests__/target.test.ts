import * as http from 'http'
import axios from 'axios'
import { ReplaySubject, Observable } from 'rxjs'
import { getEnv } from './env'
import { v4 } from 'uuid'
import {
  target,
  formatter,
  collectHttpContext,
  SD_HTTP_CONTEXT_KEY,
  SD_USER_KEY,
  SD_HTTP_REQ_KEY,
  SD_HTTP_RES_KEY,
  SeverityMap,
  StackdriverSeverity,
  BristolDefaultSeverity,
  StackdriverTargetOptions
} from '../'

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

// Used to pull entries to verify they were created.
const loggingClient = new Logging(gcloudOpts)

describe('target', () => {
  it('writes to Stackdriver log', async () => {
    const logger = new Bristol()
    // Use Rx to make it easier to wait for flushes.
    const flush$ = new ReplaySubject()
    const severityMap: SeverityMap<any> = {
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
      .withFormatter(formatter())
    logger.setSeverities(Object.keys(severityMap).reverse())
    const uid = v4()
    const errorToReport = new Error('oh no: ' + uid)

    const calls = [
      logger.meh('Debug test ' + uid, { a: 1, b: 2 }, true),
      logger.oh('Info test' + uid, {
        c: 1,
        d: 2,
        'sd:labels': { isTest: 'yeah boi' }
      }),
      logger.damn('Error test' + uid, errorToReport),
      logger.fuck('Critical test' + uid),
      logger.help('Alert test' + uid),
      logger.bye('Emergency test' + uid),
      logger.bye(errorToReport)
    ]

    await flush$.first().toPromise()

    const logEntries = await getLogsWithUid(uid, calls.length)

    const findEntry = (severity: StackdriverSeverity) =>
      logEntries.find((e: any) => e && e.metadata.severity === severity)
    const debugEntry = findEntry('DEBUG')
    const infoEntry = findEntry('INFO')
    const errorEntry = findEntry('ERROR')

    expect(debugEntry.data.message).toContain('Debug test')
    expect(debugEntry.data.a).toBe(1)
    expect(debugEntry.data.b).toBe(2)
    expect(debugEntry.data.eventTime).toBeDefined()

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

  it('includes sd:httpContext and sd:user', async () => {
    const uid = v4()
    const logger = new Bristol()
    // Use Rx to make it easier to wait for flushes.
    const flush$ = new ReplaySubject()

    logger
      .addTarget(
        createTarget({
          onFlushed: flush$.next.bind(flush$),
          onFlushError: flush$.error.bind(flush$)
        })
      )
      .withFormatter(formatter())
    const calls: any[] = []
    const server = http
      .createServer((req, res) => {
        res.statusCode = 200
        if (req.method === 'GET') {
          calls.push(
            logger.info('Processing request ' + uid, new Error('http error'), {
              [SD_HTTP_CONTEXT_KEY]: collectHttpContext(req, res),
              [SD_USER_KEY]: 'user1'
            })
          )
        }
        if (req.method === 'POST') {
          calls.push(
            logger.error('Processing request ' + uid, new Error('http error'), {
              [SD_HTTP_REQ_KEY]: req,
              [SD_HTTP_RES_KEY]: res,
              [SD_USER_KEY]: 'user2'
            })
          )
        }
        res.write('Waddup')
        res.end()
      })
      .listen()

    try {
      const addr = server.address()
      const url = `http://127.0.0.1:${addr.port}`
      const client = axios.create({ baseURL: url })
      await client.get('/IAmTheDerg/TheBigBadDerg')
      await client.post(
        '/WhatDoWeSayToDeath',
        { answer: 'Not Today' },
        {
          headers: {
            referrer: 'ya mum',
            'user-agent': 'austin powers',
            'x-forwarded-for': '1.2.3.4'
          }
        }
      )
      await flush$.first().toPromise()

      const logEntries = await getLogsWithUid(uid, calls.length)

      const findEntry = (severity: StackdriverSeverity) =>
        logEntries.find((e: any) => e && e.metadata.severity === severity)

      const infoEntry = findEntry('INFO')
      expect(infoEntry).toBeDefined()
      expect(infoEntry.data.context).toMatchSnapshot()
      const errorEntry = findEntry('ERROR')
      expect(errorEntry).toBeDefined()
      expect(errorEntry.data.context).toMatchSnapshot()
    } finally {
      server.close()
    }
  })

  /**
   * Uses Rx to poll for the log entries that contain the specified uid
   *
   * @param uid
   */
  function getLogsWithUid(uid: string, requiredLength = 1) {
    const predicate = (e: any) => e.data.message.includes(uid)
    // We can only do 1 List call per second, so make sure we don't do it that often.
    // So a little explanation on this.
    // First, we wait 3 seconds, then request entries (newest first).
    // We collect all entries fetched using `scan`, and filter the ones
    // that contains the uid (`map`).
    // `first` will emit all entries once we confirm that we have at least `requiredLength`
    // entries.
    // The `repeat` will repeat the source timer (3 seconds) which will call the API
    // again, and it will keep repeating until `first` emits an item, completing the observable.
    // `toPromise` returns a promise that resolves when that happens.
    return Observable.timer(3000)
      .mergeMap(() =>
        loggingClient
          .log(logName)
          .getEntries({
            pageSize: 1000,
            orderBy: 'timestamp desc'
          })
          .then(([entries]: any) => entries)
      )
      .repeat()
      .scan((acc: any, next: any) => [...acc, ...next], [])
      .map((entries: any) => entries.filter(predicate))
      .first((entries: any) => entries.length >= requiredLength)
      .toPromise()
  }

  function createTarget<S extends string = BristolDefaultSeverity>(
    opts: Partial<StackdriverTargetOptions<S>>
  ) {
    return target({
      ...opts,
      ...gcloudOpts,
      logName
    })
  }
})
