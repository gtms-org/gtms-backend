import { NextFunction, Request, Response } from 'express'
import logger from '@gtms/lib-logger'
import createError from 'http-errors'

export function getAppKeyAuthMiddleware(apps: { [appName: string]: string }) {
  const authKeys = Object.keys(apps).reduce(
    (keys: { [key: string]: string }, app) => {
      keys[apps[app]] = app

      return keys
    },
    {}
  )

  return (req: Request, res: Response, next: NextFunction) => {
    const appKey = req.headers['x-access-key'] as string

    if (!appKey) {
      logger.log({
        level: 'error',
        message: 'No app key in header, access denied',
        traceId: res.get('x-traceid'),
      })
      return next(createError(401, 'Access key is invalid'))
    }

    if (!authKeys[appKey]) {
      logger.log({
        level: 'error',
        message: 'Invalid app key, access denied',
        traceId: res.get('x-traceid'),
      })
      return next(createError(401, 'Access key is invalid'))
    }

    next()
  }
}
