import { Request, Response, NextFunction } from 'express'
import createError from 'http-errors'
import { IUser, UserModel, serializeUser } from '@gtms/lib-models'
import { getPaginationParams } from '@gtms/commons'
import logger from '@gtms/lib-logger'

export default {
  findByIds(req: Request, res: Response, next: NextFunction) {
    const {
      body: { ids },
    } = req

    if (!Array.isArray(ids)) {
      return next(createError(400, 'ids param has to be an array'))
    }

    UserModel.find({
      _id: {
        $in: ids,
      },
    })
      .then((users: IUser[]) => {
        res.status(200).json(users.map(user => serializeUser(user)))
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
  list(req: Request, res: Response, next: NextFunction) {
    const { limit, offset } = getPaginationParams(req)

    UserModel.paginate(
      { isActive: true },
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
          docs: result.docs.map((user: IUser) => serializeUser(user)),
        })
      }
    )
  },
  byTags(req: Request, res: Response, next: NextFunction) {
    const { limit, offset } = getPaginationParams(req)
    const { q } = req.query

    let tagsToFind: string[] = q
      .split(',')
      .map((tag: string) => {
        return tag !== '' ? tag.trim() : null
      })
      .filter((tag: string) => tag)

    if (tagsToFind.length === 0) {
      return res.status(400).end()
    }

    if (tagsToFind.length > 10) {
      tagsToFind = tagsToFind.slice(0, 10)
    }

    UserModel.paginate(
      {
        isActive: true,
        tags: {
          $in: tagsToFind,
        },
      },
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
          docs: result.docs.map((user: IUser) => serializeUser(user)),
        })
      }
    )
  },
}
