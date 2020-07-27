import { Request, Response, NextFunction } from 'express'
import { IAuthRequest, getPaginationParams } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import {
  FavGroupModel,
  IFavGroup,
  FavPostModel,
  IFavPost,
  FavUserModel,
  IFavUser,
  serializeUser,
} from '@gtms/lib-models'
import { findGroupsByIds, findPostsByIds } from '@gtms/lib-api'

function getFavGroups(
  owner: string,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { limit, offset } = getPaginationParams(req)

  FavGroupModel.paginate(
    {
      owner,
    },
    {
      offset,
      limit,
      sort: {
        order: 'asc',
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
        return res.status(200).json([])
      }

      try {
        const groups = await findGroupsByIds(
          result.docs.map(fav => fav.group),
          {
            traceId: res.get('x-traceid'),
          }
        )

        res.status(200).json({
          ...result,
          docs: groups,
        })
      } catch (err) {
        res.status(500).end()

        logger.log({
          level: 'error',
          message: `Can not fetch groups info: ${err}`,
          traceId: res.get('x-traceid'),
        })
      }
    }
  )
}

function getFavUsers(
  owner: string,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { limit, offset } = getPaginationParams(req)

  FavUserModel.paginate(
    {
      owner,
    },
    {
      offset,
      limit,
      populate: 'user',
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
        return res.status(200).json([])
      }

      res.status(200).json({
        ...result,
        docs: result.docs.map(doc => serializeUser(doc.user)),
      })
    }
  )
}

function getFavPosts(
  owner: string,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { limit, offset } = getPaginationParams(req)

  FavPostModel.paginate(
    {
      owner,
    },
    {
      offset,
      limit,
      sort: {
        order: 'asc',
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
        return res.status(200).json([])
      }

      try {
        const posts = await findPostsByIds(
          result.docs.map(fav => fav.post),
          {
            traceId: res.get('x-traceid'),
          }
        )

        res.status(200).json({
          ...result,
          docs: posts,
        })
      } catch (err) {
        res.status(500).end()

        logger.log({
          level: 'error',
          message: `Can not fetch groups info: ${err}`,
          traceId: res.get('x-traceid'),
        })
      }
    }
  )
}

export default {
  addFavGroup(req: IAuthRequest, res: Response, next: NextFunction) {
    const { group } = req.body

    if (!group || group === '') {
      return res.status(400).end()
    }

    FavGroupModel.create({
      group,
      owner: req.user.id,
      order: req.body.order || 0,
    })
      .then((favGroup: IFavGroup) => {
        logger.log({
          message: `User ${req.user.email} added group ${favGroup.group} to favs`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        res.status(201).end()
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
          res.status(400).json(err.errors)
        } else {
          next(err)

          logger.log({
            message: `Request error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }
      })
  },
  removeFavGroup(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    FavGroupModel.deleteOne({
      group: id,
      owner: req.user.id,
    })
      .then(({ ok }) => {
        if (ok > 0) {
          res.status(200).end()

          logger.log({
            message: `User ${req.user.email} removed group ${id} from favs`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
          return
        }

        res.status(404).end()
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Request error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  getUserFavGroups(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params

    return getFavGroups(userId, req, res, next)
  },
  getMyFavGroups(req: IAuthRequest, res: Response, next: NextFunction) {
    return getFavGroups(req.user.id, req, res, next)
  },
  addFavUser(req: IAuthRequest, res: Response, next: NextFunction) {
    const { user } = req.body

    if (!user || user === '') {
      return res.status(400).end()
    }

    FavUserModel.create({
      user,
      owner: req.user.id,
    })
      .then((favUser: IFavUser) => {
        logger.log({
          message: `User ${req.user.email} added another user ${favUser.user} to favs`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        res.status(201).end()
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
          res.status(400).json(err.errors)
        } else {
          next(err)

          logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }
      })
  },
  removeFavUser(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    FavUserModel.deleteOne({
      user: id,
      owner: req.user.id,
    })
      .then(({ ok }) => {
        if (ok > 0) {
          res.status(200).end()

          logger.log({
            message: `User ${req.user.email} removed another user ${id} from favs`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
          return
        }

        res.status(404).end()
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  getUserFavUsers(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params

    return getFavUsers(userId, req, res, next)
  },
  getMyFavUsers(req: IAuthRequest, res: Response, next: NextFunction) {
    return getFavUsers(req.user.id, req, res, next)
  },
  addFavPost(req: IAuthRequest, res: Response, next: NextFunction) {
    const { post } = req.body

    if (!post || post === '') {
      return res.status(400).end()
    }

    FavPostModel.create({
      post,
      owner: req.user.id,
    })
      .then((favPost: IFavPost) => {
        logger.log({
          message: `User ${req.user.email} added post ${favPost.post} to favs`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        res.status(201).end()
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
          res.status(400).json(err.errors)
        } else {
          next(err)

          logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }
      })
  },
  removeFavPost(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    FavPostModel.deleteOne({
      post: id,
      owner: req.user.id,
    })
      .then(({ ok }) => {
        if (ok > 0) {
          res.status(200).end()

          logger.log({
            message: `User ${req.user.email} removed post ${id} from favs`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
          return
        }

        res.status(404).end()
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  getUserFavPosts(req: Request, res: Response, next: NextFunction) {
    const { userId } = req.params

    return getFavPosts(userId, req, res, next)
  },
  getMyFavPosts(req: IAuthRequest, res: Response, next: NextFunction) {
    return getFavPosts(req.user.id, req, res, next)
  },
  isGroupInFavs(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.query

    if (!Array.isArray(id) || id.length === 0) {
      return res.status(400).end()
    }

    FavGroupModel.find({
      owner: req.user.id,
      group: {
        $in: id,
      },
    })
      .then((favGroups: IFavGroup[]) => {
        const result: { [key: string]: boolean } = favGroups.reduce(
          (all: { [key: string]: boolean }, fav) => {
            all[fav.group] = true

            return all
          },
          {}
        )

        for (const groupId of id) {
          if (!result[groupId]) {
            result[groupId] = false
          }
        }

        res
          .status(200)
          .json(result)
          .end()
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  async bulkUpdateFavGroupsOrder(
    req: IAuthRequest,
    res: Response,
    next: NextFunction
  ) {
    const { body } = req

    if (!Array.isArray(body) || body.length === 0) {
      return res.status(400).end()
    }

    try {
      await FavGroupModel.updateMany(
        {
          owner: req.user.id,
        },
        {
          order: 0,
        }
      )
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      next(err)
    }

    const groups = body.slice(0, 10) // to not make to many updates on DB, UI does not support more

    Promise.all(
      groups.map((group, index) => {
        return FavGroupModel.updateOne(
          {
            owner: req.user.id,
            group: group,
          },
          {
            order: index,
          }
        )
      })
    )
      .then(() => {
        res.status(200).end()
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
