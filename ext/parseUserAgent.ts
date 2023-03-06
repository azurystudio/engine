import { UAParser } from 'https://esm.sh/ua-parser-js@1.0.33?pin=v110'
import type { FetchContext } from '../FetchContext.d.ts'

export function parseUserAgent(c: FetchContext) {
  const header =
    (c.req.headers as Record<string, string | undefined>)['user-agent']

  if (!header) {
    return
  }

  const userAgent = new UAParser(header)

  const browser = userAgent.getBrowser()
  const cpu = userAgent.getCPU()
  const device = userAgent.getDevice()
  const engine = userAgent.getEngine()
  const os = userAgent.getOS()

  return {
    browser: {
      name: browser.name,
      version: browser.version,
    },

    cpu: {
      architecture: cpu.architecture,
    },

    device: {
      model: device.model,
      type: device.type,
      vendor: device.vendor,
    },

    engine: {
      name: engine.name,
      version: engine.version,
    },

    os: {
      name: os.name,
      version: os.version,
    },
  }
}
