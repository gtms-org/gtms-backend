import { Request, Response, NextFunction } from 'express'
import createError from 'http-errors'
import { IGroup, GroupModel, serializeGroup } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export default {
  findByIds(req: Request, res: Response, next: NextFunction) {
    const {
      body: { ids },
    } = req

    if (!Array.isArray(ids)) {
      return next(createError(400, 'ids param has to be an array'))
    }

    GroupModel.find({
      _id: {
        $in: ids,
      },
    })
      .then((groups: IGroup[]) => {
        res.status(200).json(groups.map(group => serializeGroup(group)))
      })
      .catch(err => {
        logger.log({
          message: `Request error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  list(req: Request, res: Response, next: NextFunction) {
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

    GroupModel.paginate(
      { visibility: 'public' },
      {
        offset,
        limit,
      },
      (err, result) => {
        if (err) {
          logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          return next(err)
        }
        res.status(200).json({
          ...result,
          docs: result.docs.map((group: IGroup) => serializeGroup(group)),
        })
      }
    )
  },
}
