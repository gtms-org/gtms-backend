import { Response, NextFunction } from 'express'
import GroupModel, { IGroup } from '../models/groups'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const { body } = req

    GroupModel.create({
      name: body.name,
      description: body.description,
      type: body.type,
      visibility: body.visibility,
      avatar: body.avatar,
      tags: body.tags,
      members: body.members,
      owner: req.user.id,
    })
      .then((group: IGroup) => {
        res.status(201).json({
          id: group._id,
          name: group.name,
          slug: group.slug,
          description: group.description,
          type: group.type,
          visibility: group.visibility,
          avatar: group.avatar,
          tags: group.tags,
          members: group.members,
        })

        logger.log({
          message: `New group ${group.name} (${group._id}) has been created`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          res.status(400).json(err.errors)

          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        } else {
          next(err)

          logger.log({
            message: `Request error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }
      })
  },
  list(req: IAuthRequest, res: Response, next: NextFunction) {
    const { pagination = { limit: 25, page: 1 } } = req.query

    if (pagination.limit > 50) {
      return res.status(400).json({
        pagination: 'Limit can not be bigger than 50',
      })
    }

    GroupModel.paginate({ type: 'public' }, pagination, (err, result) => {
      if (err) {
        logger.log({
          message: `Request error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        return next(err)
      }
      res.status(200).json(result)
    })
  },
}
