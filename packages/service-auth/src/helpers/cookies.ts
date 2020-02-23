import cookie from 'cookie'

export default (key: string, value: string | number | object, hrs: number) => {
  if ('number' === typeof value) {
    value = value.toString()
  }

  if ('object' === typeof value) {
    value = JSON.stringify(value)
  }

  return cookie.serialize(key, value, {
    expires: new Date(Date.now() + 1000 * 60 * hrs),
    httpOnly: false,
    path: '/',
  })
}
