import { join } from 'https://deno.land/std@v0.178.0/path/mod.ts'
// @deno-types='https://cdn.jsdelivr.net/npm/@types/ms@0.7.31/index.d.ts'
import ms from 'https://cdn.jsdelivr.net/npm/ms@2.1.3/+esm'
// @deno-types='https://cdn.jsdelivr.net/npm/yaml@2.2.1/dist/index.d.ts'
import yaml from 'https://cdn.jsdelivr.net/npm/yaml@2.2.1/+esm'
// @deno-types='https://cdn.jsdelivr.net/npm/nanoid@4.0.1/async/index.d.ts'
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid@4.0.1/async/index.browser.js/+esm'
import type { Configuration, ParsedConfiguration } from './Configuration.d.ts'

export async function parseConfiguration(
  tmpDir: string,
): Promise<ParsedConfiguration> {
  try {
    const config = yaml.parse(
      await Deno.readTextFile(join(tmpDir, './darkflare.yml')),
    ) as Configuration

    if (typeof config.cache === 'string') {
      config.cache = ms(config.cache) / 1000
    }

    return {
      name: config.name ?? `darkflare-${await nanoid(16)}`,
      base: config.base,
      cors: config.cors,
      cache: config.cache ?? 0,
    }
  } catch (_err) {
    return {
      name: `darkflare-${await nanoid(16)}`,
      base: undefined,
      cors: undefined,
      cache: 0,
    }
  }
}
