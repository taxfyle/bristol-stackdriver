import { FormatResult } from './types'
import { collectHttpContext } from '.'

export const SD_LABELS_KEY = 'sd:labels'
export const SD_HTTP_CONTEXT_KEY = 'sd:httpContext'
export const SD_HTTP_REQ_KEY = 'sd:req'
export const SD_HTTP_RES_KEY = 'sd:res'
export const SD_USER_KEY = 'sd:user'

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
      line: '',
      severity: severity
    }

    let msgElements: Array<string> = []
    const len = elems.length
    for (let idx = 0; idx < len; idx++) {
      const element = elems[idx]
      // Last element is the aggregate obbject.
      if (idx === len - 1) {
        const { file, line, ...rest } = element

        // `sd:*` keys are special.
        const sdLabels = rest[SD_LABELS_KEY]
        delete rest[SD_LABELS_KEY]
        const sdHttpContext = rest[SD_HTTP_CONTEXT_KEY]
        delete rest[SD_HTTP_CONTEXT_KEY]
        const sdUser = rest[SD_USER_KEY]
        delete rest[SD_USER_KEY]
        const sdReq = rest[SD_HTTP_REQ_KEY]
        delete rest[SD_HTTP_REQ_KEY]
        const sdRes = rest[SD_HTTP_RES_KEY]
        delete rest[SD_HTTP_RES_KEY]

        Object.assign(payload, rest)
        Object.assign(labels, sdLabels)
        result.httpContext = sdHttpContext
          ? sdHttpContext
          : sdReq && sdRes
          ? collectHttpContext(sdReq, sdRes)
          : undefined
        result.user = sdUser
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
    const message = msgElements.join(' ')
    // In order for automatic error reporting to work,
    // the message must contain the error stack.
    result.message = result.error
      ? message
        ? `${message}\n${result.error.stack}`
        : result.error.stack
      : message
    return result
  }
}
