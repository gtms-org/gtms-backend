import { Request, NextFunction, Response } from 'express'

export const getAppInfoMiddleware = (info?: {
  app?: 'string'
  version?: 'string'
}) => (_: Request, res: Response, next: NextFunction) => {
  res.set('x-app', info?.app ?? process.env.APP_NAME)
  res.set('x-app-version', info?.version ?? process.env.APP_VERSION)

  next()
}
