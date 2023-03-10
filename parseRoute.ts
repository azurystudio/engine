import { build } from 'https://deno.land/x/esbuild@v0.17.11/mod.js'
import { slash } from './_utilities/slash.ts'
import { italic } from 'https://deno.land/std@v0.179.0/fmt/colors.ts'

export async function parseRoute(path: string): Promise<[string, string]> {
  try {
    const name = Date.now().toString()

    for (const method of ['Delete', 'Get', 'Head', 'Patch', 'Post', 'Put']) {
      let content = await Deno.readTextFile(path)

      content = content.replace(
        `${method}({`,
        `export const ${method}_${name} = ${method}({`,
      )

      await Deno.writeTextFile(path, content)
    }

    // determine exports
    const metafile = (await build({
      entryPoints: [path],
      format: 'esm',
      metafile: true,
      write: false,
    })).metafile

    const exportedModules = Object.values(metafile.outputs)[0].exports

    let url = slash(path)
      .replaceAll('[', ':')
      .replaceAll(']', '')
      .substring(path.indexOf('api') + 3)
      .replace('/mod', '')
      .replace('.ts', '')

    let importString = ''

    let routesString = ''

    if (url === '') {
      url = '/'
    }

    for (
      const [i, method] of ['Delete', 'Get', 'Head', 'Patch', 'Post', 'Put']
        .entries()
    ) {
      if (exportedModules.includes(`${method}_${name}`)) {
        routesString += `[${i}, '${url}', ${method}_${name}],`
        importString += `import { ${method}_${name} } from './${
          slash(path.substring(path.indexOf('api')))
        }'\n`
      }
    }

    return [importString, routesString]
  } catch (_err) {
    throw new Error(`cannot parse route: ${italic(path)}`)
  }
}
