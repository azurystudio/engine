import type { CloudflareRequest } from './CloudflareRequest.d.ts'

export interface Route {
  schema: {
    body?: unknown
    query?: unknown
    headers?: unknown
    cookies?: unknown
    parameters?: unknown
  }

  handle: (
    request: CloudflareRequest,
    env: Environment,
    waitUntil: (promise: Promise<unknown>) => void,
    cookies: Record<string, string>,
    headers: Record<string, string>,
    parameters: Record<string, string>,
    query: Record<string, unknown>,
  ) => Promise<Response>
}
