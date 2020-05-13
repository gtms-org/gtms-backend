import { Request, Response, NextFunction } from 'express'
import config from 'config'
import { GroupModel, IGroup } from '@gtms/lib-models'
import createError from 'http-errors'
import { findMembersByIds } from '@gtms/lib-api'
import logger from '@gtms/lib-logger'

export default {
  list(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params
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

    GroupModel.findOne(
      {
        slug,
      },
      {
        members: {
          $slice: [offset, limit],
        },
      }
    )
      .then((group: IGroup | null) => {
        if (!group) {
          return next(createError(404, 'Group not found'))
        }

        const members = group.members || []

        if (members.length === 0) {
          return res.status(200).json([])
        }

        findMembersByIds(members, {
          traceId: res.get('x-traceid'),
          appKey: config.get<string>('appKey'),
        })
          .then(result => res.status(200).json(result))
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Can not fetch users details, ${err}`,
              traceId: res.get('x-traceid'),
            })

            return next(createError(500))
          })
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Database error, ${err}`,
          traceId: res.get('x-traceid'),
        })

        return next(createError(500))
      })
  },
}
