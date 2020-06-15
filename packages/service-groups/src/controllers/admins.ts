import { Request, Response, NextFunction } from 'express'
import config from 'config'
import { GroupModel, IGroup } from '@gtms/lib-models'
import createError from 'http-errors'
import { findUsersByIds } from '@gtms/lib-api'
import logger from '@gtms/lib-logger'
import { IAuthRequest } from '@gtms/commons'

export default {
  list(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params

    GroupModel.findOne({
      slug,
    })
      .then((group: IGroup | null) => {
        if (!group) {
          return next(createError(404, 'Group not found'))
        }

        const admins = group.admins || []

        admins.unshift(group.owner)

        findUsersByIds(admins, {
          traceId: res.get('x-traceid'),
        })
          .then(users => {
            res
              .status(200)
              .json(users)
              .end()
          })
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
  addAdmin(req: IAuthRequest, res: Response, next: NextFunction) {
    const { slug } = req.params
    const { user } = req.body

    if (!user || user === '') {
      return res.status(400).end()
    }

    GroupModel.findOne({
      slug,
    })
      .then(async (group: IGroup | null) => {
        if (!group) {
          return res.status(404).end()
        }

        if (`${group.owner}` !== `${req.user.id}`) {
          return res.status(403).end()
        }

        const admins = group.admins || []

        if (admins.includes(user)) {
          return res.status(201).end()
        }

        admins.push(user)

        group.admins = admins

        try {
          group.save()

          res.status(201).end()
        } catch (err) {
          logger.log({
            level: 'error',
            message: `Database error, ${err}`,
            traceId: res.get('x-traceid'),
          })

          return next(createError(500))
        }
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
  removeAdmin(req: IAuthRequest, res: Response, next: NextFunction) {
    const { slug, user } = req.params

    if (!user || user === '') {
      return res.status(400).end()
    }

    GroupModel.findOne({
      slug,
    })
      .then(async (group: IGroup | null) => {
        if (!group) {
          return res.status(404).end()
        }

        if (`${group.owner}` !== `${req.user.id}`) {
          return res.status(403).end()
        }

        const admins = group.admins || []
        const index = admins.indexOf(user)

        if (index === -1) {
          return res.status(404).end()
        }

        admins.splice(index, 1)

        group.admins = admins

        try {
          group.save()

          res.status(200).end()
        } catch (err) {
          logger.log({
            level: 'error',
            message: `Database error, ${err}`,
            traceId: res.get('x-traceid'),
          })

          return next(createError(500))
        }
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
