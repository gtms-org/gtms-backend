import { Request, Response, NextFunction } from 'express'
import {
  PostModel,
  IPost,
  serializePost,
  serializePostWithUser,
} from '@gtms/lib-models'
import {
  IAuthRequest,
  getPaginationParams,
  getUniqueValues,
  arrayToHash,
} from '@gtms/commons'
import { findMembersByIds } from '@gtms/lib-api'
import logger from '@gtms/lib-logger'
import config from 'config'

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

        findMembersByIds(getUniqueValues(result.docs, 'owner'), {
          traceId: res.get('x-traceid'),
          appKey: config.get<string>('appKey'),
        })
          .then(members => {
            const membersHash = arrayToHash(members, 'id')

            res.status(200).json({
              ...result,
              docs: result.docs.map((post: IPost) =>
                serializePostWithUser(post, membersHash)
              ),
            })
          })
          .catch(err => {
            logger.log({
              message: `Can not fetch user info ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })

            res.status(500).end()
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
