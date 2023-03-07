import { assertEquals } from 'https://deno.land/std@v0.178.0/testing/asserts.ts'
// @deno-types='https://cdn.jsdelivr.net/npm/nanoid@4.0.1/async/index.d.ts'
import { nanoid } from 'https://cdn.jsdelivr.net/npm/nanoid@4.0.1/async/index.browser.js/+esm'
import { encrypt } from './encrypt.ts'
import { decrypt } from './decrypt.ts'

Deno.test('encrypt/decrypt text', async () => {
  const text = 'Hello World'

  const secret = await nanoid(128)

  const encryptedText = await encrypt(text, secret)
  const decryptedText = await decrypt(encryptedText, secret)

  assertEquals(text, decryptedText)
})
