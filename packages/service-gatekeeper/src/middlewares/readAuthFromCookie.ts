import { NextFunction, Request, Response } from 'express'

export default (req: Request, res: Response, next: NextFunction) => {
  const { accessToken } = req.cookies

  if (accessToken && !req.headers['x-access-token']) {
    req.headers['x-access-token'] = accessToken
  }

  next()
}
