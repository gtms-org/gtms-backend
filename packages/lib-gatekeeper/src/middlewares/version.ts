import { Request, NextFunction, Response } from 'express'
import config from 'config'

export const versionMiddleware = (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  res.set('x-gk-version', config.get<string>('serviceVersion'))

  next()
}
