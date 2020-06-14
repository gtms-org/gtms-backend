import config from 'config'
import uuid from 'uuid'
import logger from '@gtms/lib-logger'
import { consul } from './consul'
import os from 'os'

export const registerInConsul = (serviceName: string, port: number) =>
  new Promise((resolve, reject) => {
    const ip = os.hostname()
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

export * from './services'
