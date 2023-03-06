export async function encrypt(str: string, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))

  const ivString = Array.from(iv).map((byte) => String.fromCharCode(byte)).join(
    '',
  )

  const algorithm = { name: 'AES-GCM', iv }

  const key = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)),
    algorithm,
    false,
    ['encrypt'],
  )

  const cipherBuffer = await crypto.subtle.encrypt(
    algorithm,
    key,
    new TextEncoder().encode(str),
  )

  const cipherArray = Array.from(new Uint8Array(cipherBuffer))

  const cipherString = cipherArray.map((byte) => String.fromCharCode(byte))
    .join('')

  return btoa(ivString + cipherString)
}
