import { Request, Response, NextFunction } from 'express'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { PostModel, IPost, serializePost } from '@gtms/lib-models'
import { publishMultiple } from '@gtms/client-queue'
import { Queues, RecordType } from '@gtms/commons'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { group, text, tags = [] },
    } = req

    if (typeof group !== 'string' || group === '') {
      return res.status(403).end()
    }

    if (
      !req.user.groupsMember.includes(group) &&
      !req.user.groupsAdmin.includes(group) &&
      !req.user.groupsOwner.includes(group)
    ) {
      return res.status(403).end()
    }

    PostModel.create({
      group,
      text,
      tags,
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

        const queueMessages: { queue: string; message: any }[] = []

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
            const queueMessages: { queue: string; message: any }[] = []

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

        res.status(200).json(serializePost(post))
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
