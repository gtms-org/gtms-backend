import { server } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'
import Consul from 'consul'
import uuid from 'uuid'
import os from 'os'

const port = parseInt(config.get<string>('port'), 10) || 3000
const serviceName = config.get<string>('serviceName')
const host = os.hostname()
const consul = Consul({
  host: config.get<string>('consulHost'),
  port: config.get<string>('consulPort'),
})
const CONSUL_ID = `${serviceName}-${host}-${port}-${uuid.v4()}`
const consulDetails = {
  name: serviceName,
  tags: ['worker'],
  address: host,
  check: {
    ttl: '10s',
    deregistercriticalserviceafter: '1m',
  },
  port,
  id: CONSUL_ID,
}

server.listen(port)
logger.info(`${serviceName.toUpperCase()} worker started on port ${port}`)

consul.agent.service.register(consulDetails, err => {
  if (err) {
    throw err
  }

  logger.info(`${serviceName.toUpperCase()} service registered in consul`)

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

  process.on('SIGINT', () => {
    consul.agent.service.deregister({ id: CONSUL_ID }, () => {
      logger.info(
        `${serviceName.toUpperCase()} service deregistered from consul`
      )
      process.exit()
    })
  })
})
