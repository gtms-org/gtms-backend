const Consul = require('consul')
const os = require('os')
const uuid = require('uuid')

function getIPAddress() {
  const ifaces = os.networkInterfaces()

  for (const ifname of Object.keys(ifaces)) {
    for (const iface of ifaces[ifname]) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        continue
      }

      return iface.address
    }
  }
}

const { CONSUL_HOST, CONSUL_PORT, PORT } = process.env

const consul = Consul({
  host: CONSUL_HOST,
  port: CONSUL_PORT,
})

module.exports = function() {
  return new Promise((resolve, reject) => {
    const ip = getIPAddress()
    const CONSUL_ID = `iframely-${ip}-${PORT}-${uuid.v4()}`
    const consulDetails = {
      name: 'iframely',
      tags: ['service'],
      address: ip,
      check: {
        ttl: '10s',
        deregistercriticalserviceafter: '1m',
      },
      port,
      id: CONSUL_ID,
    }

    consul.agent.service.register(consulDetails, err => {
      if (err) {
        return reject(err)
      }

      logger.info(`${serviceName} service registered in consul`)

      setInterval(() => {
        consul.agent.check.pass({ id: `service:${CONSUL_ID}` }, err => {
          if (err) {
            logger.log({
              level: 'error',
              message: `Can not send heartbeat to consul ${err}`,
            })
          }
        })
      }, 5 * 1000)

      const shutdown = () =>
        consul.agent.service.deregister({ id: CONSUL_ID }, () => {
          logger.info(`${serviceName} service deregistered from consul`)
          process.exit()
        })

      process.on('SIGINT', shutdown)
      process.on('SIGHUP', shutdown)
      process.on('SIGTERM', shutdown)

      resolve()
    })
  })
}
