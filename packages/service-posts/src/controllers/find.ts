import { Request, Response, NextFunction } from 'express'
import createError from 'http-errors'
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
  ISerializedGroup,
  ISerializedPost,
} from '@gtms/commons'
import { findUsersByIds, findGroupsByIds } from '@gtms/lib-api'
import logger from '@gtms/lib-logger'
import config from 'config'
import { ObjectID } from 'mongodb'

export default {
  groupPosts(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params
    const { limit, offset } = getPaginationParams(req)

    PostModel.paginate(
      { group: new ObjectID(id) },
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

        findUsersByIds(getUniqueValues(result.docs, 'owner'), {
          traceId: res.get('x-traceid'),
        })
          .then(users => {
            const usersHash = arrayToHash(users, 'id')

            res.status(200).json({
              ...result,
              docs: result.docs.map((post: IPost) =>
                serializePostWithUser(post, usersHash)
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
      { owner: new ObjectID(id) },
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
          docs: result.docs.map((post: IPost) => serializePost(post)),
        })
      }
    )
  },
  findByIds(req: Request, res: Response, next: NextFunction) {
    const {
      body: { ids },
    } = req
    const { groups = false } = req.query

    if (!Array.isArray(ids)) {
      return next(createError(400, 'ids param has to be an array'))
    }

    PostModel.find({
      _id: {
        $in: ids,
      },
    })
      .then((posts: IPost[]) => {
        if (!groups) {
          return res.status(200).json(posts.map(post => serializePost(post)))
        }

        findGroupsByIds(getUniqueValues(posts, 'group'), {
          traceId: res.get('x-traceid'),
        })
          .then(groups => {
            const groupsHash = arrayToHash(groups, 'id')

            return res.status(200).json(
              posts.map(post => {
                const result: ISerializedPost & {
                  group?: null | ISerializedGroup
                } = serializePost(post)

                result.group = groupsHash[post.group] ?? null

                return result
              })
            )
          })
          .catch(err => {
            logger.log({
              message: `Can not fetch group info ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })

            res.status(500).end()
          })
      })
      .catch(err => {
        logger.log({
          message: `Request error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
}
