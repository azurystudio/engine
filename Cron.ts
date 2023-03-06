import type { Context } from './Context.d.ts'

export interface CronContext extends Context {
  cron: string
  scheduledTime: Date
}

export function Cron(handler: (c: CronContext) => Promise<void> | void) {
  return handler
}
