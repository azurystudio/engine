// @deno-types='https://cdn.jsdelivr.net/npm/@types/ms@0.7.31/index.d.ts'
import ms from 'https://cdn.jsdelivr.net/npm/ms@2.1.3/+esm'
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid@4.0.1/async/index.browser.js/+esm'
import type { Configuration, ParsedConfiguration } from './Configuration.d.ts'

export async function parseConfiguration(
  config: Configuration
): Promise<ParsedConfiguration> {
  return {
    name: config.name ?? await nanoid(16),
    base: config.base,
    cors: config.cors,
    cache: config.cache ? ms(config.cache as string) / 1000 : 0,
  }
}
