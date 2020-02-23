import { NextFunction, Request, Response } from 'express'
import uuid from 'uuid'

export const traceIDMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const traceId = req.header('x-traceid') || uuid()
  res.set('x-traceid', traceId)

  next()
}
