import * as stackdriver from '../'

describe('index', () => {
  it('exports something', () => {
    expect(Object.keys(stackdriver).length).toBeGreaterThan(0)
  })
})
