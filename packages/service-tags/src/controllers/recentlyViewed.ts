import { Response, NextFunction } from 'express'
import logger from '@gtms/lib-logger'
import {
  IRecentlyViewedTag,
  RecentlyViewedTagModel,
  TagModel,
  ITag,
  serializeRecentlyViewedTag,
} from '@gtms/lib-models'
import { IAuthRequest, Queues, ITagsUpdateMsg, RecordType } from '@gtms/commons'
import { publishOnChannel } from '@gtms/client-queue'

export default {
  async create(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { tag, group },
    } = req

    let tagRecord: ITag | null

    try {
      tagRecord = await TagModel.findOne({ name: tag })
    } catch (err) {
      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })
    }

    if (!tagRecord) {
      return res.status(404).end()
    }

    RecentlyViewedTagModel.create({
      tag: tagRecord._id,
      group,
      owner: req.user.id,
    })
      .then((recenltyViewed: IRecentlyViewedTag) => {
        res.status(201).end()

        logger.log({
          message: `User ${req.user.email} (id: ${req.user.id}) viewed tag ${recenltyViewed.tag} in group ${recenltyViewed.group}`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })

        return recenltyViewed
      })
      .then(async (recenltyViewed?: IRecentlyViewedTag) => {
        if (!recenltyViewed) {
          return
        }

        publishOnChannel<ITagsUpdateMsg>(Queues.updateTags, {
          recordType: RecordType.recentlyViewedTag,
          data: {
            tags: [tag],
            traceId: res.get('x-traceid'),
            owner: recenltyViewed.owner,
            group: recenltyViewed.group,
          },
        })
          .then(() => {
            logger.log({
              level: 'info',
              message: `Info about recenlty viewed tag has been published to the queue ${Queues.updateTags}`,
              traceId: res.get('x-traceid'),
            })
          })
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Can not publish recenlty viewed tag info into queue ${Queues.updateTags} - error: ${err}`,
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

    RecentlyViewedTagModel.find({
      group: id,
      owner: req.user.id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(15)
      .populate('tag')
      .then((records: IRecentlyViewedTag[]) => {
        res
          .status(200)
          .json(records.map(record => serializeRecentlyViewedTag(record)))
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
