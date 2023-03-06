import * as Realm from 'https://esm.sh/realm-web@2.0.0?pin=v110'
import router from './router.ts'
import type { CloudflareRequest } from './CloudflareRequest.d.ts'
import type { ParsedConfiguration } from './Configuration.d.ts'
import type { CronContext } from './Cron.ts'
import type { MailContext } from './Mail.ts'
import type { Route } from './Route.d.ts'

// the below variables get defined during build time
const routes = (null as unknown) as [number, string, Route][] | undefined,
  // deno-lint-ignore no-explicit-any
  window: Record<string, any> = { __d: {} },
  config = (null as unknown) as ParsedConfiguration,
  handleCron = undefined as
    | ((c: CronContext) => Promise<void> | void)
    | undefined,
  handleMail = undefined as
    | ((c: MailContext) => Promise<void> | void)
    | undefined

// deno-lint-ignore no-explicit-any
async function setup(env: any) {
  if (!window.__d.env) {
    window.__d.env = env
  }

  window.__d = {
    ...window.__d,
    ...config,
  }

  if (
    env.realm_app && env.realm_token && env.realm_database &&
    !window.__d.database
  ) {
    const app = new Realm.App(env.realm_app),
      credentials = Realm.Credentials.apiKey(env.realm_token),
      user = await app.logIn(credentials),
      client = user.mongoClient('mongodb-atlas')

    window.__d.database = client.db(env.realm_database)
  }
}

export default {
  ...(routes && {
    async fetch(
      request: CloudflareRequest,
      // deno-lint-ignore no-explicit-any
      env: any,
      context: {
        waitUntil: (promise: Promise<unknown>) => void
      },
    ) {
      const cache = await caches.open(config.name)

      if (config.cache > 0 && request.method === 'GET') {
        const cachedResponse = await cache.match(request)

        if (cachedResponse) {
          return cachedResponse
        }
      }

      await setup(env)

      const response = await router(
        routes,
        request,
        context,
        env,
      )

      if (config.cache > 0 && request.method === 'GET' && response.ok) {
        context.waitUntil(cache.put(request, response.clone()))
      }

      return response
    },
  }),

  ...(handleCron && {
    async scheduled(
      event: {
        cron: string
        type: string
        scheduledTime: number
      },
      // deno-lint-ignore no-explicit-any
      env: any,
      context: {
        waitUntil: (promise: Promise<unknown>) => void
      },
    ) {
      await setup(env)

      await handleCron({
        env,
        cron: event.cron,
        scheduledTime: new Date(event.scheduledTime),
        waitUntil: context.waitUntil,
      })
    },
  }),

  ...(handleMail && {
    async email(
      message: {
        from: string
        to: string
        headers: Headers
        raw: ReadableStream<Uint8Array>
        rawSize: number
        setReject: (reason: string) => void
        forward: (email: string, headers?: Headers) => Promise<void>
      },
      // deno-lint-ignore no-explicit-any
      env: any,
      context: {
        waitUntil: (promise: Promise<unknown>) => void
      },
    ) {
      const h: Record<string, string> = {}

      for (const [name, value] of message.headers) {
        h[name.toLowerCase()] = value
      }

      await setup(env)

      await handleMail({
        env,
        message: {
          from: message.from,
          to: message.to,
          headers: h,
          stream: message.raw,
          size: message.rawSize,
          reject: message.setReject,
          async forward(email, headers) {
            if (!headers) {
              return await message.forward(email)
            }

            const h = new Headers()

            for (const [name, value] of Object.values(headers)) {
              h.set(name, value)
            }

            await message.forward(email, h)
          },
        },
        waitUntil: context.waitUntil,
      })
    },
  }),
}
