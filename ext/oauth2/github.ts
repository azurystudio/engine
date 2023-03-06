import queryString from 'https://esm.sh/query-string@8.1.0?pin=v110'
import type { FetchContext } from '../../FetchContext.d.ts'

export interface GithubUser {
  id: number
  login: string
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  name: string
  company: string
  blog: string
  location: string
  email: string | null
  hireable: boolean
  bio: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

const github = {
  async getAccessToken(c: FetchContext): Promise<string | undefined> {
    const clientId = (c.env as Record<string, string>).github_client_id
    const clientSecret = (c.env as Record<string, string>).github_client_secret

    if (!clientId || !clientSecret) {
      throw new Error('Please configure the oauth2 module!')
    }

    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: (c.req.query as Record<string, string>).code,
      }),
    })

    const data = await res.json()

    return data.error ? undefined : data.access_token
  },

  async getUser(token: string): Promise<GithubUser | undefined> {
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: {
          accept: 'application/vnd.github.v3+json',
          authorization: `bearer ${token}`,
        },
      })

      if (res.ok) {
        return
      }

      const data = await res.json()

      if (!data.email) {
        const res = await fetch('https://api.github.com/user/emails', {
          headers: {
            accept: 'application/vnd.github.v3+json',
            authorization: `bearer ${token}`,
          },
        })

        const emails = await res.json()

        if (res.ok) {
          data.email = (emails.find((e: { primary: boolean }) =>
            e.primary
          ) ?? emails[0]).email
        }
      }

      return data
    } catch (_err) {
      return
    }
  },

  redirect(c: FetchContext, scope?: string[]) {
    const clientId = (c.env as Record<string, string>).github_client_id

    if (!clientId) {
      throw new Error('Please configure the oauth2 module!')
    }

    const query = queryString.stringify({
      client_id: clientId,
      scope: (scope ?? ['read:user']).join(' '),
      allow_signup: true,
    })

    c.res.redirect(`https://github.com/login/oauth/authorize?${query}`)
  },
}

export default github
