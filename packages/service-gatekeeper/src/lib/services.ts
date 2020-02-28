import fs from 'fs'
import path from 'path'
import { Router, Request } from 'express'
import proxy from 'express-http-proxy'
import { http } from './enums'
import logger from './logger'
import auth from '../middlewares/auth'
import uuid from 'uuid'

const configurationDir = path.resolve(path.join(__dirname, '../services'))

logger.debug(`Services config dir: ${configurationDir}`)

const isJsFile = (file: string): boolean => {
  const arr = file.split('.')
  return arr[arr.length - 1] === 'js'
}

const traceIdDecorator = (proxyReqOpts: any, srcReq: Request) => {
  proxyReqOpts.headers['x-traceid'] = srcReq.header('x-traceid') || uuid()

  return proxyReqOpts
}

const proxyOptions: any = {
  proxyReqOptDecorator: traceIdDecorator,
  parseReqBody: false,
  reqAsBuffer: true,
  timeout: 3500,
}

export default (gatekeeperRouter: Router): Promise<void> =>
  new Promise((resolve, reject) => {
    fs.readdir(configurationDir, async (err, files) => {
      if (err) {
        return reject(err)
      }

      for (const file of files) {
        if (!isJsFile(file)) {
          continue
        }

        const {
          url,
          provider,
          name,
          locations,
        } = require(`${configurationDir}/${file}`).default

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
  })
