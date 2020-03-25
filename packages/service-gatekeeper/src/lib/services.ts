import path from 'path'
import { Router, Request } from 'express'
import proxy from 'express-http-proxy'
import { http } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import auth from '../middlewares/auth'
import uuid from 'uuid'
import services from '../services'

const configurationDir = path.resolve(path.join(__dirname, '../services'))

logger.debug(`Services config dir: ${configurationDir}`)

const traceIdDecorator = (proxyReqOpts: any, srcReq: Request) => {
  proxyReqOpts.headers['x-traceid'] = srcReq.header('x-traceid') || uuid()

  return proxyReqOpts
}

const proxyOptions: proxy.ProxyOptions = {
  proxyReqOptDecorator: traceIdDecorator,
  parseReqBody: false,
  reqAsBuffer: true,
  timeout: 3500,
}

export default (gatekeeperRouter: Router): Promise<void> =>
  new Promise(resolve => {
    for (const service of services) {
      const { url, provider, name, locations } = service

      if (!Array.isArray(locations)) {
        // todo add logs here
        continue
      }

      const router = Router()

      for (const location of locations) {
        logger.info(
          `[${name}] Exposing endpoint ${location.method} ${url}${location.path} to ${provider}${location.path}`
        )

        const middlewares = []

        if (location.restricted) {
          middlewares.push(auth)
        }

        switch (location.method) {
          case http.POST:
            router.post(
              location.path,
              middlewares,
              proxy(`${provider}${location.path}`, proxyOptions)
            )
            break

          case http.GET:
            router.get(
              location.path,
              middlewares,
              proxy(`${provider}${location.path}`, proxyOptions)
            )
            break

          case http.DELETE:
            router.delete(
              location.path,
              middlewares,
              proxy(`${provider}${location.path}`, proxyOptions)
            )
            break

          default:
            throw new Error('Invalid or not supported http method')
        }
      }

      gatekeeperRouter.use(url, router)
    }

    resolve()
  })
