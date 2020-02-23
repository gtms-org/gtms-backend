import http from 'http'

export default function({
  url,
  jwt,
  traceId,
}: {
  url: string
  jwt: any
  traceId: string
}) {
  return new Promise((resolve, reject) => {
    const headers: { [key: string]: string } = {
      'x-access-token': JSON.stringify(jwt),
      'x-traceid': traceId,
    }

    http
      .get(
        url,
        {
          timeout: 3500,
          headers,
        },
        res => {
          let response = ''

          res.setEncoding('utf8')
          res.on('data', chunk => {
            response += chunk
          })
          res.on('end', () => {
            try {
              const json = JSON.parse(response)

              resolve(json)
            } catch (e) {
              reject(`Can not parse JSON: ${response}: ${e}`)
            }
          })
        }
      )
      .on('error', e => {
        reject(e)
      })
      .on('timeout', (e: Error) => {
        reject(`Request timeout ${e}`)
      })
  })
}
