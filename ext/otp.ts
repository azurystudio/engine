import * as OTP from 'https://deno.land/x/otpauth@v9.0.2/dist/otpauth.esm.js'

export const otp = {
  /**
   * Create a random secret.
   */
  createSecret(length = 64) {
    return [...Array(length)].map(() =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  },

  /**
   * Get the 6-digit token for a given timestamp.
   */
  getToken(secret: string, timestamp?: number) {
    const totp = new OTP.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTP.Secret.fromHex(secret),
    })

    return totp.generate({ timestamp })
  },

  /**
   * Create a URI that you can use, for example, for a QR code to scan with Google Authenticator.
   */
  createURI(label: string, issuer: string, secret: string) {
    const totp = new OTP.TOTP({
      issuer,
      label,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTP.Secret.fromHex(secret),
    })

    return totp.toString()
  },

  /**
   * Determine if the token is valid.
   */
  isValid(token: string, secret: string) {
    const totp = new OTP.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTP.Secret.fromHex(secret),
    })

    return totp.validate({ token }) === 0
  },
}
