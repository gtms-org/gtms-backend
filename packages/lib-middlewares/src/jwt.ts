import { NextFunction, Response } from 'express'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'

export const JWTMiddleware = (
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers['x-access-token'] as string

  try {
    const user = JSON.parse(token)

    req.user = user

    next()
  } catch (err) {
    // invalid token
    logger.log({
      message: `Parsing jwt token failed ${err}`,
      level: 'error',
      traceId: res.get('x-traceid'),
    })
    res
      .status(401)
      .json({ message: 'JWT token is invalid' })
      .end()
  }
}
