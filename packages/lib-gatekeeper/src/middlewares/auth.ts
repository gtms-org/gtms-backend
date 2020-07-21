import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import logger from '@gtms/lib-logger'
import config from 'config'

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers['x-access-token']

  if (!token) {
    logger.log({
      level: 'info',
      message: 'No token in header, access denied',
      traceId: res.get('x-traceid'),
    })
    return res
      .status(401)
      .send('Access token is invalid')
      .end()
  }

  jwt.verify(
    token as string,
    config.get<string>('secret'),
    (err: Error, decoded: any) => {
      if (err) {
        logger.log({
          level: 'info',
          message: `Token in headers present, but token verification failed, access denied (${err})`,
          traceId: res.get('x-traceid'),
        })
        return res
          .status(401)
          .send('Access token is invalid')
          .end()
      }

      req.headers['x-access-token'] = JSON.stringify(decoded)

      next()
    }
  )
}
