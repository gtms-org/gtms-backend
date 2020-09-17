import { Request, Response, NextFunction } from 'express'
import { IAuthRequest, getPaginationParams, arrayToHash } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { CommentModel, IComment, serializeComment } from '@gtms/lib-models'
import { findUsersByIds } from '@gtms/lib-api'
import { ObjectID } from 'mongodb'

export default {
  postComments(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    const { limit, offset } = getPaginationParams(req)

    CommentModel.paginate(
      { post: new ObjectID(id) },
      {
        offset,
        limit,
        sort: {
          createdAt: 'desc',
        },
      },
      async (err, result) => {
        if (err) {
          logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          return next(err)
        }

        if (result.docs.length === 0) {
          return res.status(200).json(result)
        }

        const ownerIds = result.docs.reduce(
          (all: string[], comment: IComment) => {
            if (!all.includes(`${comment.owner}`)) {
              all.push(`${comment.owner}`)
            }

            if (Array.isArray(comment.subComments)) {
              for (const subcomment of comment.subComments) {
                if (!all.includes(`${subcomment.owner}`)) {
                  all.push(`${subcomment.owner}`)
                }
              }
            }

            return all
          },
          []
        )

        try {
          const owners = arrayToHash(
            await findUsersByIds(ownerIds, {
              traceId: res.get('x-traceid'),
            }),
            'id'
          )

          res.status(200).json({
            ...result,
            docs: result.docs.map((comment: IComment) =>
              serializeComment(comment, owners)
            ),
          })
        } catch (err) {
          logger.log({
            message: `API Error - can not fetch info about comment's owners ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          res.status(500).end()
        }
      }
    )
  },
  subComments(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    const { limit, offset } = getPaginationParams(req)

    CommentModel.paginate(
      { parent: new ObjectID(id) },
      {
        offset,
        limit,
        sort: {
          createdAt: 'desc',
        },
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
          docs: result.docs.map((comment: IComment) =>
            serializeComment(comment)
          ),
        })
      }
    )
  },
  myComments(req: IAuthRequest, res: Response, next: NextFunction) {
    const { limit, offset } = getPaginationParams(req)

    CommentModel.paginate(
      { owner: new ObjectID(req.user.id) },
      {
        offset,
        limit,
        sort: {
          createdAt: 'desc',
        },
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
          docs: result.docs.map((comment: IComment) =>
            serializeComment(comment)
          ),
        })
      }
    )
  },
  findById(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params

    CommentModel.findById(id)
      .then((comment: IComment | null) => {
        if (!comment) {
          // checking for subComments
          CommentModel.findOne({
            subComments: {
              $elemMatch: {
                _id: id,
              },
            },
          })
            .then((comment: IComment | null) => {
              if (!comment) {
                return res.status(404).end()
              }

              return res.status(200).json(serializeComment(comment))
            })
            .catch(err => {
              logger.log({
                message: `Database error ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })

              next(err)
            })
        }

        return res.status(200).json(serializeComment(comment))
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
}
