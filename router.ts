import { handleError } from './handleError.ts'
import type { CloudflareRequest } from './CloudflareRequest.d.ts'
import type { Route } from './Route.d.ts'

async function router(
  routes: [number, string, Route][],
  request: CloudflareRequest,
  context: {
    waitUntil: (promise: Promise<unknown>) => void
    [key: string]: unknown
  },
  env: Environment,
) {
  try {
    const url = new URL(request.url)

    let parameters: Record<string, string> = {}

    for (const [method, endpoint, route] of routes) {
      const match = url.pathname.match(RegExp(
        `^${
          (window.__d.base ? window.__d.base + endpoint : endpoint)
            .replace(/(\/?)\*/g, '($1.*)?') // trailing wildcard
            .replace(/(\/$)|((?<=\/)\/)/, '') // remove trailing slash or double slash
            .replace(/:(\w+)(\?)?(\.)?/g, '$2(?<$1>[^/]+)$2$3') // named parameters
            .replace(/\.(?=[\w(])/, '\\.') // dot in path
            .replace(/\)\.\?\(([^\[]+)\[\^/g, '?)\\.?($1(?<=\\.)[^\\.') // optional image format
        }/*$`,
      ))

      if (!match) {
        continue
      }

      if (match.groups) {
        parameters = match.groups
      }

      // parse headers
      const headers: Record<string, string> = {}

      for (const [key, value] of request.headers) {
        headers[key.toLowerCase()] = value
      }

      // preflight requests
      if (
        request.method === 'OPTIONS' && headers.origin &&
        headers['access-control-request-method']
      ) {
        return new Response(null, {
          status: 204,
          headers: {
            ...(window.__d.cors &&
              { 'access-control-allow-origin': window.__d.cors }),
            'access-control-allow-methods': '*',
            'access-control-allow-headers':
              headers['access-control-request-headers'] ?? '*',
            'access-control-allow-credentials': 'false',
            'access-control-max-age': '600',
          },
        })
      }

      // parse request query
      const query: Record<string, unknown> =
        Object.fromEntries(url.searchParams) ?? {}

      for (const key in query) {
        const item = query[key] as string

        if (item === '' || item === 'true') {
          query[key] = true
        } else if (item === 'false') {
          query[key] = false
        } else if (item.includes(',')) {
          query[key] = item.split(',')
        } else if (
          !isNaN((item as unknown) as number) && !isNaN(parseFloat(item))
        ) {
          query[key] = parseInt(item)
        } else if (item === 'undefined') {
          query[key] = undefined
        } else if (item === 'null') {
          query[key] = null
        }
      }

      // parse cookies
      let cookies: Record<string, string>

      try {
        cookies = (headers.cookies || '')
          .split(/;\s*/)
          .map((pair) => pair.split(/=(.+)/))
          .reduce((acc: Record<string, string>, [key, value]) => {
            acc[key] = value

            return acc
          }, {})
      } catch (_err) {
        cookies = {}
      }

      // general requests
      if (
        request.method ===
          ['DELETE', 'GET', 'HEAD', 'PATCH', 'POST', 'PUT'][method]
      ) {
        return await route.handle(
          request,
          env,
          context.waitUntil,
          cookies,
          headers,
          parameters,
          query,
        )
      }
    }

    return handleError('Not Found', request)
  } catch (err) {
    if (err instanceof Response) {
      return err
    }

    if (!(err instanceof Error) || !err.message.startsWith('Malformed')) {
      console.log(err)
    }

    return handleError(
      err instanceof Error ? err.message : 'Something Went Wrong',
      request,
    )
  }
}

export default router
