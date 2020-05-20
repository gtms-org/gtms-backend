import { Request } from 'express'

export function getPaginationParams(
  req: Request
): { limit: number; offset: number } {
  let limit = parseInt(req.query.limit || 25, 10)
  let offset = parseInt(req.query.offset || 0, 10)

  if (!Number.isInteger(limit)) {
    limit = 25
  }

  if (!Number.isInteger(offset)) {
    offset = 0
  }

  if (limit > 50) {
    limit = 50
  }

  return {
    limit,
    offset,
  }
}
