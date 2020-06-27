import { Request, Response, NextFunction } from 'express'
import logger from '@gtms/lib-logger'
import { PostModel, IPost, serializePost } from '@gtms/lib-models'
import { publishMultiple } from '@gtms/client-queue'
import {
  Queues,
  RecordType,
  NotificationType,
  GroupUpdateTypes,
  ISerializedPost,
  ISerializedGroup,
  IAuthRequest,
  UserUpdateTypes,
  ESIndexUpdateType,
  ESIndexUpdateRecord,
} from '@gtms/commons'
import { validateObjectId } from '@gtms/client-mongoose'
import { canAddPost, getGroup } from '@gtms/lib-api'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { group, text },
    } = req

    if (!validateObjectId(group)) {
      return res.status(400).end()
    }

    canAddPost(req.user.id, group, {
      traceId: res.get('x-traceid'),
    })
      .then(() => {
        const tags = text.match(/#(\w+)\b/gi)

        PostModel.create({
          group,
          text,
          tags: Array.isArray(tags)
            ? tags
                .filter((value, index, self) => {
                  return self.indexOf(value) === index
                })
                .map(tag => tag.replace('#', '').trim())
            : [],
          owner: req.user.id,
        })
          .then((post: IPost) => {
            res.status(201).json(serializePost(post))

            logger.log({
              message: `New post created by ${req.user.email} for group ${group} has been added`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })

            return post
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
                message: `Database error ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })
            }
          })
          .then(async (post?: IPost) => {
            if (!post) {
              return
            }

            const queueMessages: { queue: string; message: any }[] = [
              {
                queue: Queues.groupUpdate,
                message: {
                  type: GroupUpdateTypes.increasePostsCounter,
                  data: {
                    group: post.group,
                    traceId: res.get('x-traceid'),
                  },
                },
              },
              {
                queue: Queues.userUpdate,
                message: {
                  type: UserUpdateTypes.increasePostsCounter,
                  data: {
                    user: post.owner,
                    traceId: res.get('x-traceid'),
                  },
                },
              },
              {
                queue: Queues.updateESIndex,
                message: {
                  type: ESIndexUpdateType.create,
                  record: ESIndexUpdateRecord.post,
                  data: {
                    ...serializePost(post),
                    traceId: res.get('x-traceid'),
                  },
                },
              },
              {
                queue: Queues.newNotification,
                message: {
                  relatedRecordType: RecordType.group,
                  relatedRecordId: post._id,
                  notificationType: NotificationType.newPost,
                  owner: post.owner,
                  traceId: res.get('x-traceid'),
                },
              },
            ]

            if (Array.isArray(post.tags) && post.tags.length > 0) {
              queueMessages.push({
                queue: Queues.updateTags,
                message: {
                  recordType: RecordType.post,
                  data: {
                    tags: post.tags,
                    traceId: res.get('x-traceid'),
                    owner: post.owner,
                  },
                },
              })
            }

            publishMultiple(res.get('x-traceid'), ...queueMessages)
          })
      })
      .catch(() => {
        res.status(403).end()

        logger.log({
          message: `User ${req.user.email} tried to add post to group ${group} but he has no rights to do that`,
          level: 'warn',
          traceId: res.get('x-traceid'),
        })
      })
  },
  update(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params
    const { body } = req
    const query = {
      _id: id,
      owner: req.user.id,
    }

    PostModel.findOne(query)
      .then((post: IPost) => {
        if (!post) {
          return res.status(404).end()
        }

        const createdAt = new Date(post.createdAt)
        const now = new Date()

        if (now.getTime() - createdAt.getTime() > 900000) {
          // 15min timeout, edit operation is forbidden
          return res.status(403).end()
        }

        const payload: {
          tags?: string[]
          text?: string
        } = {}
        ;['text', 'tags'].forEach((field: 'text' | 'tags') => {
          if (typeof body[field] !== 'undefined') {
            payload[field] = body[field]
          }
        })

        PostModel.findOneAndUpdate(query, payload, { new: true })
          .then((post: IPost | null) => {
            if (!post) {
              return res.status(404).end()
            }

            logger.log({
              message: `Post ${post._id} has been updated`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })

            res.status(200).json(serializePost(post))

            return post
          })
          .then((post: IPost) => {
            const queueMessages: { queue: string; message: any }[] = [
              {
                queue: Queues.updateESIndex,
                message: {
                  type: ESIndexUpdateType.update,
                  record: ESIndexUpdateRecord.post,
                  data: {
                    ...serializePost(post),
                    traceId: res.get('x-traceid'),
                  },
                },
              },
            ]

            if (Array.isArray(post.tags) && post.tags.length > 0) {
              queueMessages.push({
                queue: Queues.updateTags,
                message: {
                  recordType: RecordType.post,
                  data: {
                    tags: post.tags,
                    traceId: res.get('x-traceid'),
                    owner: post.owner,
                  },
                },
              })
            }

            publishMultiple(res.get('x-traceid'), ...queueMessages)
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
                message: `Database error ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })
            }
          })
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
  show(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params

    PostModel.findById(id)
      .then((post: IPost | null) => {
        if (!post) {
          return res.status(404).end()
        }

        const serializedPost: ISerializedPost & {
          group?: ISerializedGroup
        } = serializePost(post)

        getGroup(post.group, { traceId: res.get('x-traceid') })
          .then(group => {
            serializedPost.group = group

            res.status(200).json(serializedPost)
          })
          .catch(err => {
            res.status(200).json(serializedPost)

            logger.log({
              level: 'error',
              message: `Can not fetch info about post's group, returning without it - ${err}`,
              traceId: res.get('x-traceid'),
            })
          })
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
