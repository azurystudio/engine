import type { IncomingRequestCfProperties } from 'https://cdn.jsdelivr.net/npm/@cloudflare/workers-types@4.20230307.0/index.ts'

export interface CloudflareRequest extends Request {
  cf: IncomingRequestCfProperties
}
