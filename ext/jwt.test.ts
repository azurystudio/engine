import { assertEquals } from 'https://deno.land/std@v0.178.0/testing/asserts.ts'
import { nanoid } from 'https://esm.sh/nanoid@4.0.1/async?pin=v110'
import { jwt } from './jwt.ts'

Deno.test('jwt module', async (t) => {
  const tokenSecret = await nanoid(32)

  const encryptionSecret = await nanoid(128)

  const token = await jwt.sign({ message: 'content' }, tokenSecret)

  const encryptedToken = await jwt.sign(
    { message: 'secret message', aud: 'world' },
    tokenSecret,
    { encrypt: encryptionSecret },
  )

  const expiredToken = await jwt.sign({ exp: '-5m' }, tokenSecret)

  await t.step('verify token', () => {
    assertEquals(typeof token, 'string')

    assertEquals(typeof encryptedToken, 'string')

    assertEquals(typeof expiredToken, 'string')
  })

  await t.step('verify token', async () => {
    assertEquals(await jwt.verify(token, tokenSecret), { message: 'content' })

    assertEquals(
      await jwt.verify(encryptedToken, tokenSecret, {
        decrypt: encryptionSecret,
        audience: 'world',
      }),
      { aud: 'world', message: 'secret message' },
    )

    assertEquals(await jwt.verify(expiredToken, tokenSecret), undefined)
  })
})
