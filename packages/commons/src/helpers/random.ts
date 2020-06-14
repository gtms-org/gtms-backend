export function randomString(
  length: number,
  chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
): string {
  let result = ''

  for (let i = length; i > 0; --i) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }

  return result
}

export function randomInt(min: number, max: number) {
  return min + Math.floor((max - min) * Math.random())
}
