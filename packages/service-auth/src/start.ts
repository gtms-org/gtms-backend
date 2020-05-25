import { app } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'
import Consul from 'consul'
import uuid from 'uuid'
import os from 'os'

const port = config.get<number>('port') || 3000
const host = os.hostname()
const consul = Consul({
  host: 'localhost',
  port: '8500',
  secure: false,
})
const CONSUL_ID = `${config.get<string>(
  'serviceName'
)}-${host}-${port}-${uuid.v4()}`

const consulDetails = {
  name: config.get<string>('serviceName'),
  tags: ['service', 'auth'],
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

    setInterval(() => {
      consul.agent.check.pass({ id: `service:${CONSUL_ID}` }, err => {
        if (err) {
          throw err
        }
      })
    }, 5 * 1000)

    process.on('SIGINT', () => {
      consul.agent.service.deregister({ id: CONSUL_ID }, () => {
        process.exit()
      })
    })
  })
})
