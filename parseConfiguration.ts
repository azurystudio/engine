import { join } from 'https://deno.land/std@v0.178.0/path/mod.ts'
import ms from 'https://esm.sh/ms@2.1.3?pin=v110'
import yaml from 'https://esm.sh/yaml@2.2.1?pin=v110'
import { nanoid } from 'https://esm.sh/nanoid@4.0.1/async?pin=v110'
import type {
  Configuration,
  ParsedConfiguration,
} from './Configuration.d.ts'

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
