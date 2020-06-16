import { Response, NextFunction } from 'express'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { CommentModel, IComment, serializeComment } from '@gtms/lib-models'
import { publishMultiple } from '@gtms/client-queue'
import {
  Queues,
  RecordType,
  ESIndexUpdateType,
  ESIndexUpdateRecord,
} from '@gtms/commons'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { post, text, parent, tags },
    } = req

    // check somehow if user can add
    CommentModel.create({
      post,
      text,
      parent,
      tags,
      owner: req.user.id,
    })
      .then((comment: IComment) => {
        res.status(201).json(serializeComment(comment))

        logger.log({
          message: `New comment to post ${comment.post} created by ${req.user.email} has been added`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        return comment
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
      .then(async (comment: IComment) => {
        const queueMessages: { queue: string; message: any }[] = [
          {
            queue: Queues.updateESIndex,
            message: {
              type: ESIndexUpdateType.create,
              record: ESIndexUpdateRecord.comment,
              data: {
                ...serializeComment(comment),
                traceId: res.get('x-traceid'),
              },
            },
          },
        ]
        if (Array.isArray(comment.tags) && comment.tags.length > 0) {
          queueMessages.push({
            queue: Queues.updateTags,
            message: {
              recordType: RecordType.comment,
              data: {
                tags: comment.tags,
                traceId: res.get('x-traceid'),
                owner: comment.owner,
              },
            },
          })
        }

        publishMultiple(res.get('x-traceid'), ...queueMessages)
      })
  },
  update(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params
    const { body } = req
    const query = {
      _id: id,
      owner: req.user.id,
    }

    CommentModel.findOne(query)
      .then((comment: IComment) => {
        if (!comment) {
          return res.status(404).end()
        }

        const createdAt = new Date(comment.createdAt)
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

        CommentModel.findOneAndUpdate(query, payload, { new: true })
          .then((comment: IComment | null) => {
            if (!comment) {
              return res.status(404).end()
            }

            logger.log({
              message: `Comment ${comment._id} has been updated`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })

            res.status(200).json(serializeComment(comment))

            return comment
          })
          .then((comment?: IComment) => {
            if (!comment) {
              return
            }

            const queueMessages: { queue: string; message: any }[] = [
              {
                queue: Queues.updateESIndex,
                message: {
                  type: ESIndexUpdateType.update,
                  record: ESIndexUpdateRecord.comment,
                  data: {
                    ...serializeComment(comment),
                    traceId: res.get('x-traceid'),
                  },
                },
              },
            ]

            if (Array.isArray(comment.tags) && comment.tags.length > 0) {
              queueMessages.push({
                queue: Queues.updateTags,
                message: {
                  recordType: RecordType.comment,
                  data: {
                    tags: comment.tags,
                    traceId: res.get('x-traceid'),
                    owner: comment.owner,
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
}
