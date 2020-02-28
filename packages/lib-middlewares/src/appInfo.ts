import { Request, NextFunction, Response } from 'express'
import config from 'config'

export const getAppInfoMiddleware = (info?: {
  app?: 'string'
  version?: 'string'
}) => (_: Request, res: Response, next: NextFunction) => {
  res.set('x-app', info?.app ?? config.get<string>('serviceName'))
  res.set(
    'x-app-version',
    info?.version ?? config.get<string>('serviceVersion')
  )

  next()
}
