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
        $regex: `*${query}*`,
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
}
