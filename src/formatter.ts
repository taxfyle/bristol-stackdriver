import { FormatResult } from './types'

const LABELS_KEY = 'sd:labels'

/**
 * Bristol formatter for Stackdriver.
 */
export function formatter() {
  return function stackdriverFormatter(
    _opts: any,
    severity: string,
    date: Date,
    elems: Array<any>
  ): FormatResult {
    const payload: any = {}
    const labels = {}
    const result: FormatResult = {
      payload,
      labels,
      file: '',
      line: ''
    }

    let msgElements: Array<string> = []
    const len = elems.length
    for (let idx = 0; idx < len; idx++) {
      const element = elems[idx]
      // Last element is the aggregate obbject.
      if (idx === len - 1) {
        const { file, line, ...rest } = element
        // If an object with key `sd:labels` was logged,
        // assume it to be an object with labels.
        const sdLabels = rest[LABELS_KEY]
        delete rest[LABELS_KEY]
        Object.assign(payload, rest)
        Object.assign(labels, sdLabels)
        result.file = file
        result.line = line
      } else if (element === undefined) {
        msgElements.push('<undefined>')
      } else if (element instanceof Error) {
        result.error = element
      } else if (typeof element === 'string') {
        msgElements.push(element)
      } else {
        /* istanbul ignore else */
        if (typeof element.toString === 'function') {
          msgElements.push(element.toString())
        }
      }
    }
    result.message = msgElements.join(' ')
    return result
  }
}
