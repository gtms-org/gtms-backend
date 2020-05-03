import { Router, Request } from 'express'
import { http } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import proxy from 'express-http-proxy'
import uuid from 'uuid'
import { IServiceConfig } from './types.d/config'
import { authMiddleware } from './middlewares/auth'

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

export function initRouter(router: Router, config: IServiceConfig[]) {
  for (const service of config) {
    const { url, provider, name, locations } = service

    const serviceRouter = Router()

    for (const location of locations) {
      logger.info(
        `[${name}] Exposing endpoint ${location.method} ${url}${location.path} to ${provider}${location.path}`
      )

      const middlewares = []

      if (location.restricted === true) {
        middlewares.push(authMiddleware)
      }

      switch (location.method) {
        case http.POST:
          serviceRouter.post(
            location.path,
            middlewares,
            proxy(`${provider}${location.path}`, proxyOptions)
          )
          break

        case http.GET:
          serviceRouter.get(
            location.path,
            middlewares,
            proxy(`${provider}${location.path}`, proxyOptions)
          )
          break

        case http.DELETE:
          serviceRouter.delete(
            location.path,
            middlewares,
            proxy(`${provider}${location.path}`, proxyOptions)
          )
          break

        default:
          throw new Error('Invalid or not supported http method')
      }
    }

    router.use(url, serviceRouter)
  }
}
