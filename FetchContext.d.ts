import type {
  Static,
  TypeSchema,
} from 'https://deno.land/x/typemap@v0.1.6/mod.ts'
import type { CloudflareRequest } from './CloudflareRequest.d.ts'
import type { Context } from './Context.d.ts'

type Merge<A, B> = A & B

export interface FetchContext<
  ParsedBody = unknown,
  ParsedQuery = unknown,
  ParsedHeaders = unknown,
  ParsedCookies = unknown,
  ParsedParameters = unknown,
> extends Context {
  data: Map<unknown, unknown>

  error: (
    errorMessage:
      | 'Access Denied'
      | 'Bad Request'
      | 'Malformed Request'
      | 'Not Found'
      | 'Payload Too Large'
      | 'Service Unavailable'
      | 'Something Went Wrong'
      | 'Unauthorized'
      | 403
      | 400
      | 405
      | 404
      | 413
      | 503
      | 500
      | 401,
  ) => {
    code: number
    message: string
  }

  req: Merge<
    {
      raw: () => CloudflareRequest
      body: ParsedBody extends TypeSchema ? Static<ParsedBody> : ParsedBody
      query: ParsedQuery extends TypeSchema ? Static<ParsedQuery> : ParsedQuery
      headers: ParsedHeaders extends TypeSchema ? Static<ParsedHeaders>
        : ParsedHeaders
      cookies: ParsedCookies extends TypeSchema ? Static<ParsedCookies>
        : ParsedCookies
      geo: {
        ip: string
        city?: string
        region?: string
        country?: string
        continent?: string
        regionCode?: string
        latitude?: string
        longitude?: string
        postalCode?: string
        timezone?: string
        datacenter?: string
      }
    },
    ParsedParameters extends TypeSchema ? Static<ParsedParameters>
      : ParsedParameters
  >

  res: {
    code: (code: number) => void
    cookie: (
      name: string,
      value: string,
      options?: {
        expiresAt?: Date
        maxAge?: number
        domain?: string
        path?: string
        secure?: boolean
        httpOnly?: boolean
        sameSite?: 'strict' | 'lax' | 'none'
      },
    ) => void
    header: (name: string, value: string) => void
    html: (data: string, code?: number) => void
    json: (data: Record<string, unknown>, code?: number) => void
    text: (data: string, code?: number) => void
    redirect: (destination: string, code?: number) => void
    formData: (data: FormData, code?: number) => void
    blob: (data: Blob, code?: number) => void
    stream: (data: ReadableStream<Uint8Array>, code?: number) => void
    buffer: (data: ArrayBuffer | Uint8Array, code?: number) => void
  }
}
