import { Request, Response, NextFunction } from 'express'
import createError from 'http-errors'
import { IGroup, GroupModel, serializeGroup } from '@gtms/lib-models'
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

    GroupModel.find({
      _id: {
        $in: ids,
      },
    })
      .then((groups: IGroup[]) => {
        res.status(200).json(groups.map(group => serializeGroup(group)))
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

    GroupModel.paginate(
      { visibility: 'public' },
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
          docs: result.docs.map((group: IGroup) => serializeGroup(group)),
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

    GroupModel.paginate(
      {
        visibility: 'public',
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
          docs: result.docs.map((group: IGroup) => serializeGroup(group)),
        })
      }
    )
  },
}
