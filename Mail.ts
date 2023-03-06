import type { Context } from './Context.d.ts'

export interface MailContext extends Context {
  message: {
    from: string
    to: string
    headers: Record<string, string>
    stream: ReadableStream<Uint8Array>
    size: number
    reject: (reason: string) => void
    forward: (email: string, headers?: Record<string, string>) => Promise<void>
  }
}

export function Mail(handler: (c: MailContext) => Promise<void> | void) {
  return handler
}
