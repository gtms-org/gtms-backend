import { app } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'
import Consul from 'consul'
import uuid from 'uuid'
import os from 'os'

const port = parseInt(config.get<string>('port'), 10) || 3000
const host = os.hostname()
const consul = Consul({
  host: config.get<string>('consulHost'),
  port: config.get<string>('consulPort'),
})
const CONSUL_ID = `${config.get<string>(
  'serviceName'
)}-${host}-${port}-${uuid.v4()}`

const consulDetails = {
  name: config.get<string>('serviceName'),
  tags: ['service'],
  address: host,
  check: {
    ttl: '10s',
    deregistercriticalserviceafter: '1m',
  },
  port,
  id: CONSUL_ID,
}

app.listen(port, () => {
  logger.info(`Auth service started on port ${port}`)

  consul.agent.service.register(consulDetails, err => {
    if (err) {
      throw err
    }

    logger.info('Auth service registered in consul')

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
        logger.info('Auth service deregistered from consul')
        process.exit()
      })
    })
  })
})
