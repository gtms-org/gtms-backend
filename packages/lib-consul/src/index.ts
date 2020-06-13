import config from 'config'
import logger from '@gtms/lib-logger'
import Consul from 'consul'
import uuid from 'uuid'
import getIpAddress from './ip'

export const registerInConsul = (serviceName: string, port: number) =>
  new Promise((resolve, reject) => {
    getIpAddress((error, ip) => {
      if (error) {
        logger.log({
          level: 'error',
          message: 'Can not determinate IP address',
        })
        return reject()
      }

      const consul = Consul({
        host: config.get<string>('consulHost'),
        port: config.get<string>('consulPort'),
      })

      const CONSUL_ID = `${serviceName}-${ip}-${port}-${uuid.v4()}`
      const consulDetails = {
        name: config.get<string>('serviceName'),
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

        process.on('SIGINT', () => {
          consul.agent.service.deregister({ id: CONSUL_ID }, () => {
            logger.info(`${serviceName} service deregistered from consul`)
            process.exit()
          })
        })

        resolve()
      })
    })
  })
