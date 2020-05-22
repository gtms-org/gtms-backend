import { Request, Response, NextFunction } from 'express'
import { PostModel, IPost, serializePost } from '@gtms/lib-models'
import { IAuthRequest, getPaginationParams } from '@gtms/commons'
import logger from '@gtms/lib-logger'

export default {
  groupPosts(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    const { limit, offset } = getPaginationParams(req)

    PostModel.paginate(
      { group: id },
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
          docs: result.docs.map((post: IPost) => serializePost(post)),
        })
      }
    )
  },
  userPosts(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    const { limit, offset } = getPaginationParams(req)

    PostModel.paginate(
      { owner: id },
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
          docs: result.docs.map((post: IPost) => serializePost(post)),
        })
      }
    )
  },
  myPosts(req: IAuthRequest, res: Response, next: NextFunction) {
    const { limit, offset } = getPaginationParams(req)

    PostModel.paginate(
      { group: req.user.id },
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
          docs: result.docs.map((post: IPost) => serializePost(post)),
        })
      }
    )
  },
}
