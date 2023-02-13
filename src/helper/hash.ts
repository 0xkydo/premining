import blake2 from 'blake2'

export function hash(str: string | Uint8Array) {
  const hash = blake2.createHash('blake2s')
  hash.update(Buffer.from(str))
  const hashHex = hash.digest('hex')

  return hashHex
}
