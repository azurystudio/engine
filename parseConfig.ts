import { join } from 'https://deno.land/std@v0.182.0/path/mod.ts'
import type { ParsedConfiguration } from './Configuration.d.ts'

export async function parseConfig(
  tmpDir: string,
): Promise<ParsedConfiguration> {
  await Deno.writeTextFile(
    './compileConfig.ts',
    `
    import config from './mod.ts'
    import { loadConfig } from 'https://raw.githubusercontent.com/azurystudio/engine/v0.6.0/loadConfig.ts'

    await Deno.writeTextFile('./config.json', loadConfig(config))
    `,
  )

  await Deno.run({
    cmd: ['deno', 'run', '-A', './compileConfig.ts'],
    cwd: tmpDir,
  }).status()

  return JSON.parse(
    await Deno.readTextFile(join(tmpDir, './config.json')),
  ) as ParsedConfiguration
}
