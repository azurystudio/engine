import { assertEquals } from 'https://deno.land/std@v0.179.0/testing/asserts.ts'
import { Client } from './client/mod.ts'

Deno.test('api', async (t) => {
  const client = new Client({
    base: 'https://darkflare.azury.workers.dev/test',
  })

  await t.step('validation', async () => {
    const res1 = await client.get('/query_validation?key=value', {
      type: 'json',
    })

    assertEquals(res1.data, { ok: true })
  })

  await t.step('hooks', async () => {
    const res1 = await client.get('/preValidation_hook', {
      headers: {
        custom: 'darkflare',
      },
      type: 'text',
    })

    assertEquals(res1.data, 'a')

    const res2 = await client.get('/preValidation_hook', {
      type: 'text',
    })

    assertEquals(res2.data, 'b')

    const res3 = await client.get('/postHandler_hook', {
      type: 'text',
    })

    assertEquals(res3.headers.custom, 'second')
  })
})
