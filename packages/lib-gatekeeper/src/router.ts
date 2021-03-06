import { Router, Request } from 'express'
import { http } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { ConsulServices } from '@gtms/lib-consul'
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
  memoizeHost: false,
  timeout: 3500,
}

export function initRouter(router: Router, config: IServiceConfig[]) {
  const servicesList: string[] = []
  let services: ConsulServices
  const getServiceHost = (serviceName: string, path: string) => () => {
    const node = services.pickNode(serviceName)

    return `http://${node.ServiceAddress}:${node.ServicePort}${path}`
  }

  for (const service of config) {
    const { url, provider, name, locations } = service

    if (!servicesList.includes(provider)) {
      servicesList.push(provider)
    }

    const serviceRouter = Router()

    for (const location of locations) {
      logger.info(
        `[${name}] Exposing endpoint ${location.method} ${url}${location.path} to ${provider}${location.path}`
      )

      const middlewares = []

      if (location.restricted === true) {
        middlewares.push(authMiddleware)
      }

      const options = location.timeout
        ? { ...proxyOptions, timeout: location.timeout }
        : proxyOptions

      switch (location.method) {
        case http.POST:
          serviceRouter.post(
            location.path,
            middlewares,
            proxy(getServiceHost(provider, location.path), options)
          )
          break

        case http.GET:
          serviceRouter.get(
            location.path,
            middlewares,
            proxy(getServiceHost(provider, location.path), options)
          )
          break

        case http.DELETE:
          serviceRouter.delete(
            location.path,
            middlewares,
            proxy(getServiceHost(provider, location.path), options)
          )
          break

        case http.PUT:
          serviceRouter.put(
            location.path,
            middlewares,
            proxy(getServiceHost(provider, location.path), options)
          )
          break

        default:
          throw new Error('Invalid or not supported http method')
      }
    }

    router.use(url, serviceRouter)
  }

  if (servicesList.length > 0) {
    services = new ConsulServices(servicesList)
  }
}
