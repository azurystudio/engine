import { isValid, TypeSchema } from 'https://deno.land/x/typemap@v0.1.11/mod.ts'
import type { FetchContext } from './FetchContext.d.ts'
import type { Route } from './Route.d.ts'

export function route<
  ParsedBody = unknown,
  ParsedQuery = unknown,
  ParsedHeaders = unknown,
  ParsedCookies = unknown,
  ParsedParameters = unknown,
>(
  schema: {
    body?: ParsedBody
    query?: ParsedQuery
    headers?: ParsedHeaders
    cookies?: ParsedCookies
    parameters?: ParsedParameters
    preValidator?: (
      c: FetchContext<
        null,
        Record<string, unknown>,
        Record<string, string | undefined>,
        Record<string, string | undefined>,
        Record<string, string | undefined>
      >,
    ) => Promise<unknown> | unknown
    postValidator?: (
      c: FetchContext<
        ParsedBody,
        ParsedQuery,
        ParsedHeaders,
        ParsedCookies,
        ParsedParameters
      >,
    ) => Promise<unknown> | unknown
    preHandler?: (
      c: FetchContext<
        ParsedBody,
        ParsedQuery,
        ParsedHeaders,
        ParsedCookies,
        ParsedParameters
      >,
    ) => Promise<unknown> | unknown
    postHandler?: (
      c: FetchContext<
        ParsedBody,
        ParsedQuery,
        ParsedHeaders,
        ParsedCookies,
        ParsedParameters
      >,
    ) => Promise<unknown> | unknown
  },
  handler: (
    c: FetchContext<
      ParsedBody,
      ParsedQuery,
      ParsedHeaders,
      ParsedCookies,
      ParsedParameters
    >,
  ) => Promise<unknown> | unknown,
) {
  return <Route> {
    schema,

    async handle(
      r,
      env,
      waitUntil,
      cookies,
      headers,
      parameters,
      query,
    ) {
      const h = new Headers()

      let c: number | undefined,
        p

      let body:
        | string
        | Record<string, unknown>
        | ReadableStream
        | Blob
        | ArrayBuffer
        | FormData
        | null = null

      const context = {
        env,
        waitUntil,
        data: new Map(),

        req: {
          raw() {
            return r.clone()
          },
          body,
          query,
          headers,
          cookies,
          geo: {
            ip: headers['cf-connecting-ip'],
            // @ts-ignore: bug in cloudflare's types
            city: r.cf.city,
            // @ts-ignore: bug in cloudflare's types
            region: r.cf.region,
            // @ts-ignore: bug in cloudflare's types
            country: r.cf.country,
            // @ts-ignore: bug in cloudflare's types
            continent: r.cf.continent,
            // @ts-ignore: bug in cloudflare's types
            regionCode: r.cf.regionCode,
            // @ts-ignore: bug in cloudflare's types
            latitude: r.cf.latitude,
            // @ts-ignore: bug in cloudflare's types
            longitude: r.cf.longitude,
            // @ts-ignore: bug in cloudflare's types
            postalCode: r.cf.postalCode,
            // @ts-ignore: bug in cloudflare's types
            timezone: r.cf.timezone,
            datacenter: r.cf.colo,
          },
          ...parameters,
        },

        res: {
          code(code) {
            c = code
          },
          cookie(name, value, options) {
            let cookie = `${name}=${value};`

            h.set(
              'set-cookie',
              (
                options?.expiresAt &&
                (cookie += ` expires=${options.expiresAt.toUTCString()};`),
                  options?.maxAge && (cookie += ` max-age=${options.maxAge};`),
                  options?.domain && (cookie += ` domain=${options.domain};`),
                  options?.path && (cookie += ` path=${options.path};`),
                  options?.secure && (cookie += ' secure;'),
                  options?.httpOnly && (cookie += ' httpOnly;'),
                  options?.sameSite &&
                  (cookie += ` sameSite=${
                    options.sameSite.charAt(0).toUpperCase() +
                    options.sameSite.slice(1)
                  };`),
                  cookie
              ),
            )
          },
          header(name, value) {
            h.set(name, value)
          },
          html(payload, code) {
            h.set('content-type', 'text/html; charset=utf-8;')

            p = payload
            c = code
          },
          json(payload, code) {
            h.set('content-type', 'application/json; charset=utf-8;')

            p = payload
            c = code
          },
          text(payload, code) {
            h.set('content-type', 'text/plain; charset=utf-8;')

            p = payload
            c = code
          },
          redirect(destination, code) {
            h.set('location', destination)

            c = code ?? 307
          },
          blob(payload, code) {
            p = payload
            c = code
          },
          stream(payload, code) {
            p = payload
            c = code
          },
          buffer(payload, code) {
            p = payload
            c = code
          },
          formData(payload, code) {
            p = payload
            c = code
          },
        },
      } as FetchContext<
        ParsedBody,
        ParsedQuery,
        ParsedHeaders,
        ParsedCookies,
        ParsedParameters
      >

      if (window.__d.cors) {
        h.set('access-control-allow-origin', window.__d.cors)
      }

      if (r.method === 'GET') {
        h.set('cache-control', `max-age=${window.__d.cache ?? 0}`)
      }

      if (schema.preValidator) {
        const hookResult = await schema.preValidator(
          context as FetchContext<
            null,
            Record<string, unknown>,
            Record<string, string | undefined>,
            Record<string, string | undefined>,
            Record<string, string | undefined>
          >,
        )

        if (hookResult) {
          p = hookResult
        }
      }

      try {
        if (schema.body) {
          // @ts-ignore:
          const type = schema.body[Object.getOwnPropertySymbols(schema.body)[0]]

          if (type === 'blob') {
            body = await r.blob()
          } else if (type === 'buffer') {
            body = await r.arrayBuffer()
          } else if (type === 'formData') {
            body = await r.formData()
          } else if (type === 'stream') {
            body = r.body
          } else if (type === 'Object') {
            body = await r.json()
          } else if (type === 'String') {
            body = await r.text()
          }
        }
      } catch (_err) {
        // skip parsing the body
      }

      if (!p) {
        if (
          schema.parameters &&
          !isValid((schema.parameters as unknown) as TypeSchema, parameters)
        ) {
          throw new Error('Malformed Parameters')
        }

        if (
          schema.query &&
          !isValid((schema.query as unknown) as TypeSchema, query)
        ) {
          throw new Error('Malformed Query')
        }

        if (
          schema.headers &&
          !isValid((schema.headers as unknown) as TypeSchema, headers)
        ) {
          throw new Error('Malformed Headers')
        }

        if (
          schema.body && !isValid((schema.body as unknown) as TypeSchema, body)
        ) {
          throw new Error('Malformed Body')
        }

        if (
          schema.cookies &&
          !isValid((schema.cookies as unknown) as TypeSchema, cookies)
        ) {
          throw new Error('Malformed Cookies')
        }

        if (schema.postValidator) {
          const hookResult = await schema.postValidator(context)

          if (hookResult) {
            p = hookResult
          }
        }
      }

      if (!p && schema.preHandler) {
        const hookResult = await schema.preHandler(context)

        if (hookResult) {
          p = hookResult
        }
      }

      if (!p) {
        const handlerResult = await handler(context)

        if (handlerResult) {
          p = handlerResult
        }
      }

      if (schema.postHandler) {
        const hookResult = await schema.postHandler(context)

        if (!p && hookResult) {
          p = hookResult
        }
      }

      if (!c) {
        c = 200
      }

      if (c !== 200) {
        h.delete('cache-control')
      }

      if (h.has('location')) {
        return new Response(null, {
          headers: h,
          status: c,
        })
      }

      if (!p) {
        return new Response(null, {
          headers: h,
          status: c,
        })
      }

      if (typeof p === 'string') { // string
        h.set('content-length', p.length.toString())

        if (!h.has('content-type')) {
          h.set('content-type', 'text/plain; charset=utf-8;')
        }
      } else if (p instanceof Uint8Array || p instanceof ArrayBuffer) { // buffer
        h.set('content-length', p.byteLength.toString())
      } else if (p instanceof Blob) { // blob
        h.set('content-length', p.size.toString())
      } else if (!(p instanceof ReadableStream)) { // object
        p = JSON.stringify(p)

        h.set('content-length', p.length.toString())

        if (!h.has('content-type')) {
          h.set('content-type', 'application/json; charset=utf-8;')
        }

        if (((p as unknown) as { code: number }).code) {
          c = ((p as unknown) as { code: number }).code
        }
      }

      return new Response(p, {
        headers: h,
        status: c,
      })
    },
  }
}
