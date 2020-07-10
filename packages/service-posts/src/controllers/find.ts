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
import { validateObjectId } from '@gtms/client-mongoose'
import { ObjectID } from 'mongodb'

function findPosts(
  query: {
    group?: ObjectID
    tags?: {
      $all: string[]
    }
  },
  params: {
    offset?: number
    limit?: number
    sort?: {
      [key: string]: 'desc' | 'asc'
    }
  },
  traceId: string
) {
  return new Promise((resolve, reject) => {
    PostModel.paginate(query, params, (err, result) => {
      if (err) {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId,
        })
        return reject()
      }

      findUsersByIds(
        result.docs.reduce((all: string[], post) => {
          if (!all.includes(`${post.owner}`)) {
            all.push(`${post.owner}`)
          }

          if (Array.isArray(post.firstComments)) {
            for (const comment of post.firstComments) {
              if (!all.includes(`${comment.owner}`)) {
                all.push(`${comment.owner}`)
              }
            }
          }

          return all
        }, []),
        {
          traceId,
        }
      )
        .then(users => {
          const usersHash = arrayToHash(users, 'id')

          resolve({
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
            traceId,
          })

          reject()
        })
    })
  })
}

export default {
  groupPosts(req: Request, res: Response) {
    const { id } = req.params
    const { limit, offset } = getPaginationParams(req)
    const { tags } = req.query

    if (!validateObjectId(id)) {
      return res.status(400).end()
    }

    const tagsToFind: string[] = Array.isArray(tags)
      ? tags
          .map(tag => {
            return tag !== '' ? tag.trim() : null
          })
          .filter((tag: string | null) => tag)
      : []
    const query: {
      group: ObjectID
      tags?: {
        $all: string[]
      }
    } = { group: new ObjectID(id) }

    if (tagsToFind.length > 0) {
      query.tags = {
        $all: tagsToFind,
      }
    }

    findPosts(
      query,
      {
        offset,
        limit,
        sort: {
          createdAt: 'desc',
        },
      },
      res.get('x-traceid')
    )
      .then(result => res.status(200).json(result))
      .catch(() => res.status(500).end())
  },
  findByTag(req: Request, res: Response) {
    const { tags } = req.query
    const tagsToFind: string[] = Array.isArray(tags)
      ? tags
          .map(tag => {
            return tag !== '' ? tag.trim() : null
          })
          .filter((tag: string | null) => tag)
      : []

    if (tagsToFind.length === 0) {
      return res.status(400).end()
    }

    const { limit, offset } = getPaginationParams(req)

    findPosts(
      {
        tags: {
          $all: tagsToFind,
        },
      },
      {
        offset,
        limit,
        sort: {
          createdAt: 'desc',
        },
      },
      res.get('x-traceid')
    )
      .then(result => res.status(200).json(result))
      .catch(() => res.status(500).end())
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
