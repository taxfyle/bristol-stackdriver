import * as http from 'http'
import axios from 'axios'
import { collectHttpContext } from '../http-context-collector'
import { StackdriverHttpContext } from '..'

jest.setTimeout(20000)

describe('http context collector', () => {
  it('collects the correct context', async () => {
    const contexts: Array<StackdriverHttpContext> = []
    const server = http
      .createServer((req, res) => {
        res.statusCode = 200
        contexts.push(collectHttpContext(req, res))
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
            referer: 'ya mum',
            'user-agent': 'austin powers',
            'x-forwarded-for': '1.2.3.4'
          }
        }
      )

      expect(contexts).toMatchSnapshot()
    } finally {
      server.close()
    }
  })
})
