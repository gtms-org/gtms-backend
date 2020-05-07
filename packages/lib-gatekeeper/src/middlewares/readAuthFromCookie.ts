import { NextFunction, Request, Response } from 'express'
import logger from '@gtms/lib-logger'

export const readAuthFromCookieMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accessToken } = req.cookies

  if (accessToken && !req.headers['x-access-token']) {
    logger.log({
      level: 'info',
      message: `Taking access token from cookie (${accessToken})`,
      traceId: res.get('x-traceid'),
    })
    req.headers['x-access-token'] = accessToken
  }

  if (!accessToken) {
    logger.log({
      level: 'info',
      message: 'No access token cookie',
      traceId: res.get('x-traceid'),
    })
  }

  next()
}
