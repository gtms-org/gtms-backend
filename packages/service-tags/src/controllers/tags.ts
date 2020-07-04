import { Request, Response, NextFunction } from 'express'
import { TagModel, ITag } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

export default {
  find(req: Request, res: Response, next: NextFunction) {
    const query = req.query.query
    let limit = parseInt(req.query.limit, 10)

    if (!query || query.length < 3) {
      return res.status(400).end()
    }

    if (isNaN(limit) || limit < 1) {
      limit = 20
    }

    if (limit > 25) {
      limit = 25
    }

    TagModel.find({
      name: {
        $regex: `${query}.*`,
      },
    })
      .limit(limit)
      .then((tags: ITag[]) => {
        res.status(200).json(tags.map(t => t.name))
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Database error: ${err}`,
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  suggested(req: Request, res: Response, next: NextFunction) {
    const { tags } = req.body

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.status(400).end()
    }

    TagModel.find({
      name: {
        $in: tags,
      },
    })
      .then((dbTags: ITag[]) => {
        const result: { [tag: string]: number } = {}

        for (const dbTag of dbTags) {
          if (!Array.isArray(dbTag.related)) {
            continue
          }

          for (const related of dbTag.related) {
            result[related.name] = result.hasOwnProperty(related.name)
              ? (result[related.name] += 1)
              : 1
          }
        }

        return res.status(200).json(
          Object.keys(result)
            .filter(suggestion => !tags.includes(suggestion))
            .sort((a, b) => {
              if (result[a] === result[b]) {
                return 0
              }

              return result[a] > result[b] ? 1 : -1
            })
        )
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Database error: ${err}`,
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
}
