import { Request, Response, NextFunction } from 'express'
import createError from 'http-errors'
import { IGroup, GroupModel, serializeGroup } from '@gtms/lib-models'
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
}
