import {
  create,
  verify as _verify,
  VerifyOptions,
} from 'https://deno.land/x/djwt@v2.8/mod.ts'
// @deno-types='https://cdn.jsdelivr.net/npm/@types/ms@0.7.31/index.d.ts'
import ms from 'https://cdn.jsdelivr.net/npm/ms@2.1.3/+esm'
import { encrypt } from './encrypt.ts'
import { decrypt } from './decrypt.ts'

interface JwtPayload {
  iss?: string
  sub?: string
  aud?: string | string[]
  exp?: number | string | Date
  nbf?: number | string | Date
  iat?: number
  jti?: string
  // deno-lint-ignore no-explicit-any
  [key: string]: any
}

function getNumericDate(exp: number | string | Date): number {
  return Math.round(
    (typeof exp === 'string'
      ? ms(exp)
      : exp instanceof Date
      ? exp.getTime()
      : Date.now() + exp * 1000) / 1000,
  )
}

export const jwt = {
  /**
   * Sign a payload.
   */
  async sign(
    payload: JwtPayload,
    secret: string,
    options?: { encrypt?: string },
  ) {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-512' },
      true,
      ['sign', 'verify'],
    )

    const { iss, sub, aud, exp, nbf, iat, jti, ...rest } = payload

    return await create({ alg: 'HS512', typ: 'JWT' }, {
      ...(iss && { iss }),
      ...(sub && { sub }),
      ...(aud && { aud }),
      ...(exp && { exp: getNumericDate(exp) }),
      ...(nbf && { nbf: getNumericDate(nbf) }),
      ...(iat && { iat }),
      ...(jti && { jti }),
      ...(options?.encrypt
        ? {
          __data: await encrypt(JSON.stringify(rest), options.encrypt),
        }
        : rest),
    }, key)
  },

  /**
   * Verify the validity of a JSON Web Token.
   */
  async verify(
    token: string,
    secret: string,
    options?: VerifyOptions & { decrypt?: string },
  ) {
    try {
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-512' },
        true,
        ['sign', 'verify'],
      )

      let payload = await _verify(token, key, options) as JwtPayload

      if (options?.decrypt) {
        payload = {
          ...payload,
          ...JSON.parse(
            await decrypt(payload.__data, options.decrypt),
          ),
        }

        const { __data, ...p } = payload

        payload = p
      }

      return payload
    } catch (_err) {
      return undefined
    }
  },
}
