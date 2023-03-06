import { join, resolve } from 'https://deno.land/std@v0.178.0/path/mod.ts'
import { italic } from 'https://deno.land/std@v0.178.0/fmt/colors.ts'
import { ensureDir } from 'https://deno.land/std@v0.178.0/fs/mod.ts'
import { build } from 'https://deno.land/x/esbuild@v0.17.11/mod.js'
import { success, warn } from 'https://deno.land/x/drgn@v0.10.1/mod.ts'
import files from 'https://deno.land/x/read_files@v0.1.0/mod.ts'
import byte from 'https://deno.land/x/byte@v3.0.0/byte.ts'
import slash from 'https://esm.sh/slash@5.0.0?pin=v110'
import { parseConfiguration } from './parseConfiguration.ts'
import { parseRoute } from './parseRoute.ts'
import version from './version.json' assert { type: 'json' }

console.log(Deno.args[0])

const tmpDir = await Deno.makeTempDir({ prefix: 'darkflare-' }),
    config = await parseConfiguration(tmpDir)

  // copy files to temporary directory
  for await (const path of files(Deno.cwd())) {
    if (
      path.includes('.git') || path.includes('.vscode') ||
      path.includes('.github')
    ) {
      continue
    }

    const dest = path.replace(Deno.cwd(), tmpDir),
      dirPath = slash(path.replace(Deno.cwd(), tmpDir))
        .split('/')
        .slice(0, -1)
        .join('/')

    await ensureDir(dirPath)

    await Deno.copyFile(path, dest)
  }

  const srcUrl = `https://raw.githubusercontent.com/azurystudio/engine/${Deno.args[0] ?? version}`

  let workerString = (await (await fetch(`${srcUrl}/worker.ts`, {
    headers: {
      authorization: `bearer ${Deno.env.get('DENO_AUTH_TOKENS')?.replace('@raw.githubusercontent.com', '')}`
    }
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
        `import type { CronContext } from './cron.ts'`,
        `import type { CronContext } from '${srcUrl}/cron.ts'`,
      )
      .replace(
        `import type { MailContext } from './mail.ts'`,
        `import type { MailContext } from '${srcUrl}/mail.ts'`,
      )
      .replace(
        `import type { Route } from './Route.d.ts'`,
        `import type { Route } from '${srcUrl}/Route.d.ts'`,
      ),
    importString = '',
    routesString = ''

  // attach routes
  const isDir = async (path: string) => {
    try {
      return (await Deno.stat(path)).isDirectory
    } catch (_err) {
      return false
    }
  }

  if (await isDir(join(tmpDir, './api'))) {
    for await (const file of files(join(tmpDir, './api'))) {
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

  // create javascript bundle with globals
  await Deno.writeTextFile(
    join(tmpDir, './worker.ts'),
    importString + workerString,
  )

  await Deno.create(join(tmpDir, './bundle.js'))

  await Deno.run({
    cmd: ['deno', 'bundle', '-q', './worker.ts', './bundle.js'],
    cwd: tmpDir,
  }).status()

  // define globals
  let bundledCode = await Deno.readTextFile(join(tmpDir, './bundle.js'))

  // global utilities
  let darkflareNamespace = ''

  const globalModules = [
    'jwt',
    'oauth2',
    'otp',
    'sendMail',
    'encrypt',
    'decrypt',
    'ObjectId',
    'Schema',
  ]

  for (const globalModule of globalModules) {
    if (bundledCode.includes(`Darkflare.${globalModule}`)) {
      darkflareNamespace += `${globalModule}: __global${globalModule},\n`
    }
  }

  bundledCode = `const Darkflare = {${darkflareNamespace}}\n` + bundledCode

  bundledCode = `import v from '${srcUrl}/v.ts'\n` + bundledCode
  bundledCode =
    `import { Delete, Get, Head, Patch, Post, Put } from '${srcUrl}/route.ts'\n` +
    bundledCode
  bundledCode = `import { Cron } from '${srcUrl}/Cron.ts'\n` +
    bundledCode
  bundledCode = `import { Mail } from '${srcUrl}/Mail.ts'\n` +
    bundledCode

  for (const globalModule of globalModules) {
    if (bundledCode.includes(`Darkflare.${globalModule}`)) {
      bundledCode =
        `import { ${globalModule} as __global${globalModule} } from '${srcUrl}/ext/${globalModule}.ts'\n` +
        bundledCode
    }
  }

  await Deno.writeTextFile(join(tmpDir, './bundle.js'), bundledCode)

  await Deno.create(join(tmpDir, './bundle.final.js'))

  await Deno.run({
    cmd: ['deno', 'bundle', '-q', './bundle.js', './bundle.final.js'],
    cwd: tmpDir,
  }).status()

  // create final javascript bundle
  await ensureDir(join(Deno.cwd(), './dist'))

  await build({
    entryPoints: [join(tmpDir, './bundle.final.js')],
    bundle: true,
    minify: true,
    legalComments: 'none',
    format: 'esm',
    outfile: join(Deno.cwd(), './worker.js'),
  })

  // exclude file from linting
  await Deno.writeTextFile(
    join(Deno.cwd(), './worker.js'),
    `// deno-lint-ignore-file\nvar window={__d:{}};${await Deno.readTextFile(
      join(Deno.cwd(), './worker.js'),
    )}`,
  )

  // remove temporary directory to save storage
  //await Deno.remove(tmpDir, { recursive: true })

  // print the size of the worker script to the console
  const { size } = await Deno.stat(join(Deno.cwd(), './worker.js'))

  if (size < byte('5 MB')) {
    await success(byte(size))
  } else {
    await warn(`your worker script is too large ${italic(byte(size))}`)
  }

Deno.exit()
