import { italic } from 'https://deno.land/std@v0.182.0/fmt/colors.ts'
import { ensureDir } from 'https://deno.land/std@v0.182.0/fs/mod.ts'
import { join, resolve } from 'https://deno.land/std@v0.182.0/path/mod.ts'
import byte from 'https://deno.land/x/byte@v3.1.0/byte.ts'
import { success, warn } from 'https://deno.land/x/drgn@v0.10.2/mod.ts'
import { build, stop } from 'https://deno.land/x/esbuild@v0.17.15/mod.js'
import { denoPlugin } from 'https://deno.land/x/esbuild_deno_loader@0.6.0/mod.ts'
import files from 'https://deno.land/x/read_files@v0.1.0/mod.ts'
import { parseConfig } from './parseConfig.ts'
import { parseRoute } from './parseRoute.ts'
import version from './version.json' assert { type: 'json' }
import { slash } from './_utilities/slash.ts'

const tmpDir = await Deno.makeTempDir({ prefix: 'darkflare-' })
const config = await parseConfig(tmpDir)

// copy files to temporary directory
for await (const path of files(Deno.cwd())) {
  if (
    path.includes('.git') || path.includes('.vscode') ||
    path.includes('.github')
  ) {
    continue
  }

  const dest = path.replace(Deno.cwd(), tmpDir)

  const dirPath = slash(path.replace(Deno.cwd(), tmpDir))
    .split('/')
    .slice(0, -1)
    .join('/')

  await ensureDir(dirPath)

  await Deno.copyFile(path, dest)
}

const srcUrl = `https://raw.githubusercontent.com/azurystudio/engine/${
  Deno.args[0] ?? version
}`

let workerString = (await (await fetch(`${srcUrl}/worker.ts`, {
  headers: {
    authorization: `bearer ${
      Deno.env.get('DENO_AUTH_TOKENS')?.replace(
        '@raw.githubusercontent.com',
        '',
      )
    }`,
  },
})).text())
  .replace(
    'config = (null as unknown)',
    `config = ${JSON.stringify(config)}`,
  )
  .replace(
    `import router from './router.ts'`,
    `import router from '${srcUrl}/router.ts'`,
  )
  .replace(
    `import type { CloudflareRequest } from './CloudflareRequest.d.ts'`,
    `import type { CloudflareRequest } from '${srcUrl}/CloudflareRequest.d.ts'`,
  )
  .replace(
    `import type { ParsedConfiguration } from './Configuration.d.ts'`,
    `import type { ParsedConfiguration } from '${srcUrl}/Configuration.d.ts'`,
  )
  .replace(
    `import type { CronContext } from './Cron.ts'`,
    `import type { CronContext } from '${srcUrl}/Cron.ts'`,
  )
  .replace(
    `import type { MailContext } from './Mail.ts'`,
    `import type { MailContext } from '${srcUrl}/Mail.ts'`,
  )
  .replace(
    `import type { Route } from './Route.d.ts'`,
    `import type { Route } from '${srcUrl}/Route.d.ts'`,
  )

let importString = ''
let routesString = ''

// attach routes
const isDir = async (path: string) => {
  try {
    return (await Deno.stat(path)).isDirectory
  } catch (_err) {
    return false
  }
}

if (await isDir(join(tmpDir, './pages'))) {
  for await (const file of files(join(tmpDir, './pages'))) {
    if (
      !file.endsWith('.ts') || file.endsWith('.d.ts') ||
      file.endsWith('.test.ts')
    ) {
      continue
    }

    const route = await parseRoute(file)

    importString += route[0]
    routesString += route[1]
  }

  workerString = workerString
    .replace('routes = (null as unknown)', `routes = [${routesString}]`)
}

// attach durable objects
for await (const dirent of Deno.readDir(tmpDir)) {
  const path = resolve(tmpDir, dirent.name)

  if (dirent.isDirectory || !dirent.name.endsWith('.object.ts')) {
    continue
  }

  const metafile = (await build({
    entryPoints: [path],
    format: 'esm',
    metafile: true,
    write: false,
  })).metafile

  if (!metafile) {
    throw new Error(`cannot parse durable object: ${italic(path)}`)
  }

  const modules = Object.values(metafile.outputs)[0].exports

  if (modules.length > 1) {
    throw new Error(
      `only one durable object per file is allowed: ${italic(path)}`,
    )
  }

  importString += `export { ${modules[0]} } from './${dirent.name}'\n`
}

// attach cron handler
try {
  let content = await Deno.readTextFile(join(tmpDir, './cron.ts'))

  content = content.replace('cron(', 'export const handleCron = cron(')

  await Deno.writeTextFile(join(tmpDir, './cron.ts'), content)

  importString += `import { handleCron } from './cron.ts'\n`
  workerString = workerString.replace(
    ', handleCron = undefined as ((c: CronContext) => Promise<void> | void) | undefined',
    '',
  )
} catch (_err) {
  // there's no cron handler
}

// attach mail handler
try {
  let content = await Deno.readTextFile(join(tmpDir, './mail.ts'))

  content = content.replace('mail(', 'export const handleMail = mail(')

  await Deno.writeTextFile(join(tmpDir, './cron.ts'), content)

  importString += `import { handleMail } from './mail.ts'\n`
  workerString = workerString.replace(
    ', handleMail = undefined as ((c: MailContext) => Promise<void> | void) | undefined',
    '',
  )
} catch (_err) {
  // there's no mail handler
}

// create javascript bundle
await Deno.writeTextFile(
  join(tmpDir, './worker.ts'),
  importString + workerString,
)

await build({
  entryPoints: ['./worker.ts'],
  minify: true,
  allowOverwrite: true,
  legalComments: 'none',
  // @ts-ignore: outdated types
  plugins: [denoPlugin()],
  format: 'esm',
  target: 'es2020',
  outfile: join(Deno.cwd(), './worker.js'),
  absWorkingDir: tmpDir,
  banner: {
    js:
      '// @ts-nocheck\n// deno-fmt-ignore-file\n// deno-lint-ignore-file\nvar window={__d:{}};', // disable type checking/linting/formatting
  },
})

stop()

// remove temporary directory to save storage
await Deno.remove(tmpDir, { recursive: true })

// print the size of the worker script to the console
const { size } = await Deno.stat(join(Deno.cwd(), './worker.js'))

if (size < byte('5 MB')) {
  await success(byte(size))
} else {
  await warn(`your worker script is too large ${italic(byte(size))}`)
}
