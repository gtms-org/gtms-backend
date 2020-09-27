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

interface IFindPostsResult {
  docs: ISerializedPost[]
  limit: number
  offset: number
  total: number
}

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
): Promise<IFindPostsResult> {
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
          } as IFindPostsResult)
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
    const { tags, users } = req.query
    let sort: 'popular' | 'latest' | 'active' = req.query.sort
    const sortingMapper: {
      [key: string]: {
        [field: string]: 'asc' | 'desc'
      }
    } = {
      popular: {
        commentsCounter: 'desc',
        createdAt: 'desc',
      },
      latest: {
        createdAt: 'desc',
      },
      active: {
        createdAt: 'desc',
      },
    }

    if (!Object.keys(sortingMapper).includes(sort)) {
      sort = 'latest'
    }

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
    const usersToFind: string[] = Array.isArray(users)
      ? users
          .map(user => (validateObjectId(user) ? user : null))
          .filter(user => user)
      : []
    const query: {
      group: ObjectID
      tags?: {
        $all: string[]
      }
      owner?: {
        $in: string[]
      }
      commentsCounter?: {
        $gte: number
      }
    } = { group: new ObjectID(id) }

    if (tagsToFind.length > 0) {
      query.tags = {
        $all: tagsToFind,
      }
    }

    if (usersToFind.length > 0) {
      query.owner = {
        $in: usersToFind,
      }
    }

    if (sort === 'active') {
      query.commentsCounter = {
        $gte: 0,
      }
    }

    findPosts(
      query,
      {
        offset,
        limit,
        sort: sortingMapper[sort],
      },
      res.get('x-traceid')
    )
      .then(result => res.status(200).json(result))
      .catch(() => res.status(500).end())
  },
  findByTag(req: Request, res: Response) {
    const { tags, showGroups = false } = req.query
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
      .then(result => {
        if (!showGroups) {
          return res.status(200).json(result)
        }

        findGroupsByIds(getUniqueValues(result.docs, 'group'), {
          traceId: res.get('x-traceid'),
        })
          .then(groups => {
            const groupsHash = arrayToHash(groups, 'id')

            result.docs = result.docs.map(post => {
              post.group = groupsHash[post.group as string] ?? null

              return post
            })

            res.status(200).json(result)
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
                  group?: null | ISerializedGroup | string
                } = serializePost(post)

                result.group =
                  (groupsHash[post.group] as ISerializedGroup) ?? null

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
