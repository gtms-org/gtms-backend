import { Response, NextFunction } from 'express'
import logger from '@gtms/lib-logger'
import { IFavTag, FavTagModel } from '@gtms/lib-models'
import { IAuthRequest, Queues, ITagsUpdateMsg, RecordType } from '@gtms/commons'
import { publishOnChannel } from '@gtms/client-queue'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { tag, group },
    } = req

    FavTagModel.create({
      tag,
      group,
      owner: req.user.id,
    })
      .then((fav: IFavTag) => {
        res.status(201).end()

        logger.log({
          message: `User ${req.user.email} (id: ${req.user.id}) added tag ${fav.tag} in group ${fav.group} to favs`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        return fav
      })
      .then(async (fav?: IFavTag) => {
        if (!fav) {
          return
        }

        publishOnChannel<ITagsUpdateMsg>(Queues.updateTags, {
          recordType: RecordType.favTag,
          data: {
            tags: [tag],
            traceId: res.get('x-traceid'),
            owner: fav.owner,
            group: fav.group,
          },
        })
          .then(() => {
            logger.log({
              level: 'info',
              message: `Info about fav tag has been published to the queue ${Queues.updateTags}`,
              traceId: res.get('x-traceid'),
            })
          })
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Can not publish fav tag info into queue ${Queues.updateTags} - error: ${err}`,
              traceId: res.get('x-traceid'),
            })
          })
      })
      .catch(err => {
        if (err.name === 'ValidationError') {
          res.status(400).json(err.errors)

          logger.log({
            message: `Validation error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
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
  group(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    FavTagModel.find({
      group: id,
      owner: req.user.id,
    })
      .sort({
        createdAt: -1,
      })
      .populate('tag')
      .then((records: IFavTag[]) => {
        res.status(200).json(records.map(record => record.tag.name))
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
}
