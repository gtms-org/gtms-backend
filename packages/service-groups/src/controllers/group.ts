import { Response, Request, NextFunction } from 'express'
import { GroupModel, IGroup, serializeGroup } from '@gtms/lib-models'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import slugify from '@sindresorhus/slugify'
import { publishOnChannel } from '@gtms/client-queue'
import {
  Queues,
  IESGroupCreateMsg,
  IESGroupUpdateMsg,
  ESIndexUpdateType,
  ESIndexUpdateRecord,
  IUserJoinedGroupMsg,
  IUserLeftGroupMsg,
  UserUpdateTypes,
  ITagsUpdateMsg,
  RecordType,
} from '@gtms/commons'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const { body } = req

    GroupModel.create({
      name: body.name,
      description: body.description,
      type: body.type,
      visibility: body.visibility,
      tags: body.tags,
      members: [req.user.id],
      owner: req.user.id,
    })
      .then((group: IGroup) => {
        res.status(201).json(serializeGroup(group))

        logger.log({
          message: `New group ${group.name} (${group._id}) has been created`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        return group
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
      .then(async (group?: IGroup) => {
        if (!group) {
          return
        }

        // publish info about new group
        try {
          await publishOnChannel<IESGroupCreateMsg>(Queues.updateESIndex, {
            type: ESIndexUpdateType.create,
            record: ESIndexUpdateRecord.group,
            data: {
              ...serializeGroup(group),
              traceId: res.get('x-traceid'),
            },
          })

          logger.log({
            message: `Info about group ${group._id} (${group.name}) - creation - has been published to the queue`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
        } catch (err) {
          logger.log({
            message: `Can not publish message to the QUEUE: ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }

        // publish info about group tags (if any)
        if (Array.isArray(group.tags) && group.tags.length > 0) {
          try {
            await publishOnChannel<ITagsUpdateMsg>(Queues.updateTags, {
              recordType: RecordType.group,
              data: {
                tags: group.tags,
                traceId: res.get('x-traceid'),
                owner: group.owner,
              },
            })

            logger.log({
              message: `Group's tags list has been published to the queue`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })
          } catch (err) {
            logger.log({
              message: `Can not publish message to the QUEUE: ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          }
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
  async show(req: IAuthRequest, res: Response, next: NextFunction) {
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

    res.status(200).json(serializeGroup(group))
  },
  async update(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body,
      params: { slug },
    } = req

    let group: IGroup | null
    const payload: {
      name?: string
      description?: string
      type?: string
      visibility?: string
      tags?: string[]
      slug?: string
    } = {}
    ;['name', 'description', 'type', 'visibility', 'tags'].forEach(
      (field: 'name' | 'description' | 'type' | 'visibility' | 'tags') => {
        if (typeof body[field] !== 'undefined') {
          payload[field] = body[field]
        }
      }
    )

    if (payload.name) {
      payload.slug = slugify(payload.name)
    }

    try {
      group = await GroupModel.findOneAndUpdate(
        { slug, owner: req.user.id },
        payload,
        { new: true }
      )
    } catch (err) {
      logger.log({
        message: `Request error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }

    if (!group) {
      return res.status(404).end()
    }

    logger.log({
      message: `Group ${group.name} (${group._id}_ has been updated`,
      level: 'info',
      traceId: res.get('x-traceid'),
    })

    res.status(200).json(serializeGroup(group))

    // publish info about group's update
    try {
      await publishOnChannel<IESGroupUpdateMsg>(Queues.updateESIndex, {
        type: ESIndexUpdateType.update,
        record: ESIndexUpdateRecord.group,
        data: {
          ...serializeGroup(group),
          traceId: res.get('x-traceid'),
        },
      })

      logger.log({
        message: `Info about group ${group._id} (${group.name}) - update - has been published to the queue`,
        level: 'info',
        traceId: res.get('x-traceid'),
      })
    } catch (err) {
      logger.log({
        message: `Can not publish message to the QUEUE: ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })
    }

    // publish info about tags update (if any)
    if (Array.isArray(body.tags) && body.tags.length > 0) {
      try {
        await publishOnChannel<ITagsUpdateMsg>(Queues.updateTags, {
          recordType: RecordType.group,
          data: {
            tags: group.tags,
            traceId: res.get('x-traceid'),
            owner: group.owner,
          },
        })

        logger.log({
          message: `Group's tags list has been published to the queue`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })
      } catch (err) {
        logger.log({
          message: `Can not publish message to the QUEUE: ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      }
    }
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
      return res.status(400).end()
    }

    const members = group.members || []

    members.push(req.user.id)

    group.members = [...members]

    try {
      await group.save()
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }

    res.status(200).end()

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

    if (!group || !Array.isArray(group.members)) {
      return res.status(404).end()
    }

    const index = group.members.findIndex(m => m === req.user.id)

    if (index === -1) {
      return res.status(404).end()
    }

    const members = [...group.members]

    members.splice(index, 1)

    group.members = members

    try {
      await group.save()
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }

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
  },
  hasAdminAccess(req: Request, res: Response, next: NextFunction) {
    const { user, group } = req.query

    GroupModel.findOne({
      _id: group,
    })
      .then((record: IGroup | null) => {
        if (!record) {
          return res.status(404).end()
        }

        if (record.owner + '' === user) {
          return res.status(200).end()
        }

        res.status(401).end()
      })
      .catch(err => {
        next(err)

        logger.log({
          level: 'error',
          message: `Database error: ${err}`,
          traceId: res.get('x-traceid'),
        })
      })
  },
}
