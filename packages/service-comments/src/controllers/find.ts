import { Request, Response, NextFunction } from 'express'
import { IAuthRequest, getPaginationParams } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { CommentModel, IComment, serializeComment } from '@gtms/lib-models'
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
}
