import childProcess from 'child_process'

const handleIpRouteResults = (
  callback: (error: Error | undefined, ip: string | undefined) => void
) => (
  error: Error | null,
  stdout: string | undefined,
  stderr: string | undefined
) => {
  if (stdout && typeof stdout === 'string') {
    const output = stdout
console.log(output)
    const match = output.match(
      /default via ((?:[0-9]{1,3}\.){3}[0-9]{1,3}) dev eth0/
    )
console.log(match)
    let ip = undefined
    if (Array.isArray(match) && match.length >= 2) {
      ip = match[1]
    }

    if (ip) {
      callback(undefined, ip)
    } else {
      callback(
        new Error(
          'Unable to find ip, perhaps call while not within a Docker container'
        ),
        undefined
      )
    }
  } else if (error) {
    callback(error, undefined)
  } else if (stderr) {
    callback(new Error(stderr), undefined)
  } else {
    callback(new Error('No results or feedback given'), undefined)
  }
}

export default function(
  callback: (error: Error | undefined, ip: string | undefined) => void
) {
  try {
    childProcess.execFile('/sbin/ip', ['route'], handleIpRouteResults(callback))
  } catch (error) {
    if (callback) {
      callback(error, undefined)
    }
  }
}
