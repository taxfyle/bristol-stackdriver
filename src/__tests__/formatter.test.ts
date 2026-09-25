import * as stackdriver from '../'

const { Bristol } = require('bristol')

describe('formatter', () => {
  it('returns the correct object and message', async () => {
    const result = await getFormatResult(
      'info',
      'Hello',
      { a: 1 },
      { b: 2 },
      'world',
      123,
      null,
      undefined,
      /abc/i
    )

    expect(result['logging.googleapis.com/sourceLocation'].file).toContain(
      '__tests__'
    )
    expect(result['logging.googleapis.com/sourceLocation'].line).toMatch(/\d*/)
    expect(result.payload).toEqual({ a: 1, b: 2 })
    expect(result.message).toBe('Hello world 123 <undefined>')
  })

  it('special-cases sd:labels', async () => {
    const result = await getFormatResult('info', 'Hello', {
      a: 1,
      b: 2,
      'sd:labels': { label: 'value' }
    })

    expect(result.payload).toEqual({ a: 1, b: 2 })
    expect(result.labels).toEqual({ label: 'value' })
  })

  it('special-cases sd:trace', async () => {
    const result = await getFormatResult('info', 'Hello', {
      a: 1,
      b: 2,
      'sd:traceId': 'trace-1',
      'sd:spanId': 'span-1'
    })

    expect(result['logging.googleapis.com/trace']).toBe('trace-1')
    expect(result['logging.googleapis.com/spanId']).toBe('span-1')
    expect(result['logging.googleapis.com/trace_sampled']).toBe(false)
  })

  it('special-cases errors', async () => {
    const result = await getFormatResult(
      'info',
      'Hello',
      {
        a: 1,
        b: 2,
        'sd:labels': { label: 'value' }
      },
      new Error('sup')
    )
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error!.message).toBe('sup')
    expect(result.message).toBe('Hello\n' + result.error!.stack)
  })

  async function getFormatResult(...args: any[]) {
    return new Promise<stackdriver.FormatResult>(resolve => {
      const logger = new Bristol()
      const formatter: any = stackdriver.formatter()
      logger
        .addTarget(function() {
          /**/
        })
        .withFormatter(function() {
          resolve(formatter(...Array.from(arguments)))
        })
      logger.log(...args)
    })
  }
})
