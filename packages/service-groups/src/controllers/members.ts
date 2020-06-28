import { Request, Response, NextFunction } from 'express'
import {
  GroupModel,
  GroupMemberModel,
  IGroupMember,
  IGroup,
} from '@gtms/lib-models'
import createError from 'http-errors'
import { findUsersByIds } from '@gtms/lib-api'
import logger from '@gtms/lib-logger'
import { publishOnChannel, publishMultiple } from '@gtms/client-queue'
import {
  Queues,
  IUserLeftGroupMsg,
  UserUpdateTypes,
  IAuthRequest,
  getPaginationParams,
  RecordType,
  NotificationType,
} from '@gtms/commons'

export default {
  list(req: Request, res: Response, next: NextFunction) {
    const { slug } = req.params
    const { limit, offset } = getPaginationParams(req)

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

            findUsersByIds(
              docs.map(value => value.user),
              {
                traceId: res.get('x-traceid'),
              }
            )
              .then(users =>
                res.status(200).json({
                  ...result,
                  docs: users,
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

        Promise.all([
          GroupModel.updateOne(
            {
              _id: group._id,
            },
            { $inc: { membersCounter: 1 } }
          ),
          GroupMemberModel.create({
            user: req.user.id,
            group: group.id,
          }),
        ])
          .then(async () => {
            res.status(201).end()

            logger.log({
              message: `User ${req.user.id} (${req.user.email}) joined group ${group._id} (${group.name})`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })

            publishMultiple(
              res.get('x-traceid'),
              ...[
                {
                  queue: Queues.userUpdate,
                  message: {
                    type: UserUpdateTypes.joinedGroup,
                    data: {
                      group: group._id,
                      user: req.user.id,
                      traceId: res.get('x-traceid'),
                    },
                  },
                },
                {
                  queue: Queues.newNotification,
                  message: {
                    data: {
                      relatedRecordType: RecordType.group,
                      relatedRecordId: group._id,
                      notificationType: NotificationType.newGroupMember,
                      owner: req.user.id,
                      traceId: res.get('x-traceid'),
                    },
                  },
                },
              ]
            )
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

    Promise.all([
      GroupModel.updateOne(
        {
          _id: group._id,
        },
        { $inc: { membersCounter: -1 } }
      ),
      GroupMemberModel.deleteOne({
        group: group._id,
        user: req.user.id,
      }),
    ])
      .then(async ([, { deletedCount }]) => {
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
  removeMember(req: IAuthRequest, res: Response, next: NextFunction) {
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

        if (
          `${group.owner}` !== req.user.id &&
          group.admins.includes(req.user.id)
        ) {
          logger.log({
            level: 'warn',
            message: `User ${req.user.email} tried to remove member ${user} from group ${group.name} (${group._id}) without admin rights`,
            traceId: res.get('x-traceid'),
          })
          return res.status(403).end()
        }

        GroupMemberModel.deleteOne({
          group: group._id,
          user,
        })
          .then(() => {
            res.status(200).end()

            logger.log({
              level: 'info',
              message: `User ${req.user.email} removed member ${user} from group ${group.name} (${group._id})`,
              traceId: res.get('x-traceid'),
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
