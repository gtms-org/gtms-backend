import { Request, Response, NextFunction } from 'express'
import config from 'config'
import {
  GroupModel,
  GroupMemberModel,
  IGroupMember,
  IGroup,
} from '@gtms/lib-models'
import createError from 'http-errors'
import { findMembersByIds } from '@gtms/lib-api'
import logger from '@gtms/lib-logger'
import { publishOnChannel } from '@gtms/client-queue'
import {
  Queues,
  IUserJoinedGroupMsg,
  IUserLeftGroupMsg,
  UserUpdateTypes,
  IAuthRequest,
} from '@gtms/commons'

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

    GroupModel.findOne({
      slug,
    })
      .then((group: IGroup | null) => {
        if (!group) {
          return next(createError(404, 'Group not found'))
        }

        GroupMemberModel.paginate(
          {
            group: group._id,
          },
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

            const { docs } = result

            if (docs.length === 0) {
              return res.status(200).json(result)
            }

            findMembersByIds(
              docs.map(value => value.user),
              {
                traceId: res.get('x-traceid'),
                appKey: config.get<string>('appKey'),
              }
            )
              .then(members =>
                res.status(200).json({
                  ...result,
                  docs: members,
                })
              )
              .catch(err => {
                logger.log({
                  level: 'error',
                  message: `Can not fetch users details, ${err}`,
                  traceId: res.get('x-traceid'),
                })

                return next(createError(500))
              })
          }
        )
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
  async joinGroup(req: IAuthRequest, res: Response, next: NextFunction) {
    const { slug } = req.params

    let group: IGroup | null

    try {
      group = await GroupModel.findOne({ slug })
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }

    if (!group) {
      return res.status(404).end()
    }

    if (group.type !== 'public') {
      return res.status(403).end()
    }

    GroupMemberModel.findOne({
      user: req.user.id,
      group: group.id,
    })
      .then((groupMember: IGroupMember | null) => {
        if (groupMember !== null) {
          // user is already a member
          return res.status(400).end()
        }

        GroupMemberModel.create({
          user: req.user.id,
          group: group.id,
        })
          .then(async () => {
            res.status(201).end()

            logger.log({
              message: `User ${req.user.id} (${req.user.email}) joined group ${group._id} (${group.name})`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })

            try {
              await publishOnChannel<IUserJoinedGroupMsg>(Queues.userUpdate, {
                type: UserUpdateTypes.joinedGroup,
                data: {
                  group: group._id,
                  user: req.user.id,
                  traceId: res.get('x-traceid'),
                },
              })
            } catch (err) {
              logger.log({
                message: `Can not publish message to the QUEUE: ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })
            }
          })
          .catch(err => {
            logger.log({
              message: `Database error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })

            return next(err)
          })
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        return next(err)
      })
  },
  async leaveGroup(req: IAuthRequest, res: Response, next: NextFunction) {
    const { slug } = req.params

    let group: IGroup | null

    try {
      group = await GroupModel.findOne({ slug })
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }

    if (!group) {
      return res.status(404).end()
    }

    GroupMemberModel.deleteOne({
      group: group._id,
      user: req.user.id,
    })
      .then(async ({ deletedCount }) => {
        if (deletedCount > 0) {
          res.status(200).end()

          try {
            await publishOnChannel<IUserLeftGroupMsg>(Queues.userUpdate, {
              type: UserUpdateTypes.leftGroup,
              data: {
                group: group._id,
                user: req.user.id,
                traceId: res.get('x-traceid'),
              },
            })
          } catch (err) {
            logger.log({
              message: `Can not publish message to the QUEUE: ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          }
        } else {
          // user was not a group member
          res.status(400).end()
        }
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        return next(err)
      })
  },
}
