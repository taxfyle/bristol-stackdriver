import { IncomingMessage, ServerResponse } from 'http'
import { StackdriverHttpContext } from '.'

/**
 * Collects HTTP context info from Node's HTTP Request and Response objects.
 * @param req
 * @param res
 */
export function collectHttpContext(
  req: IncomingMessage,
  res: ServerResponse
): StackdriverHttpContext {
  const headers = req.headers || /* istanbul ignore next */ {}
  return {
    method: req.method!,
    url: req.url!,
    userAgent: headers['user-agent'] as string,
    referrer: headers['referer'] as string,
    responseStatusCode: res.statusCode,
    remoteIp: getRemoteIp(req)
  }
}

/**
 * Gets the remote IP, taking into account `X-Forwarded-For` headers.
 * @param req
 */
function getRemoteIp(req: IncomingMessage): string {
  /* istanbul ignore else */
  if (req.headers) {
    const header = req.headers['x-forwarded-for']
    if (typeof header !== 'undefined') {
      return header as string
    }
  }

  /* istanbul ignore else */
  /* tslint:disable-next-line:strict-type-predicates */
  if (req.connection && typeof req.connection === 'object') {
    return req.connection.remoteAddress /* istanbul ignore next */ || ''
  }

  /* istanbul ignore next */
  return ''
}
