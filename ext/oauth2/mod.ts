import github, { GithubUser } from './github.ts'
import type { FetchContext } from '../../types.d.ts'

type oAuth2Provider = 'github'

export const oauth2 = {
  async getAccessToken(
    c: FetchContext,
    _provider: oAuth2Provider,
  ): Promise<string | undefined> {
    return await github.getAccessToken(c)
  },

  async getUser<P extends oAuth2Provider>(_provider: P, token: string) {
    return await github.getUser(token) as // deno-lint-ignore no-explicit-any
    | (P extends 'github' ? GithubUser : Record<string, any>)
    | undefined
  },

  redirect(c: FetchContext, _provider: oAuth2Provider, scope?: string[]) {
    return github.redirect(c, scope)
  },
}
