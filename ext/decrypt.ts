export async function decrypt(str: string, secret: string) {
  const iv = atob(str).slice(0, 12)

  const algorithm = {
    name: 'AES-GCM',
    iv: new Uint8Array(Array.from(iv).map((char) => char.charCodeAt(0))),
  }

  const key = await crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)),
    algorithm,
    false,
    ['decrypt'],
  )

  const cipherString = atob(str).slice(12)

  const cipherBuffer = new Uint8Array(
    Array.from(cipherString).map((char) => char.charCodeAt(0)),
  )

  const buffer = await crypto.subtle.decrypt(algorithm, key, cipherBuffer)

  return new TextDecoder().decode(buffer)
}
