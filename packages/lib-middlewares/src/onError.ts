import { Request, Response, NextFunction } from 'express'

export const errorMiddleware = function(err: any, req: Request, res: Response) {
  err.url = req.url
  err.status = err.status || 500

  const result = {
    error: {
      message: err.message,
      type: err.event || err.name || 'Unexpected Error',
    },
  }
  res.status(err.status)
  res.json(result)
}
