import { Response, NextFunction } from 'express'
import logger from '@gtms/lib-logger'
import {
  FavTagModel,
  FavTagType,
  TagModel,
  GroupTagModel,
  ITag,
  IGroupTag,
  IFavTag,
} from '@gtms/lib-models'
import { IAuthRequest, Queues, ITagsUpdateMsg, RecordType } from '@gtms/commons'
import { publishOnChannel } from '@gtms/client-queue'

function getRelatedTagRecord(
  id: string,
  type: FavTagType
): Promise<[ITag | IGroupTag, string]> {
  switch (type) {
    case FavTagType.groupTag:
      return GroupTagModel.findOne({
        _id: id,
      }).then((tag: IGroupTag | undefined) => [tag, 'groupTag'])

    case FavTagType.tag:
      return TagModel.findOne({ name: id }).then((tag: ITag | undefined) => [
        tag,
        'tag',
      ])
  }
}

export default {
  async create(req: IAuthRequest, res: Response, next: NextFunction) {
    const {
      body: { tag, group, type },
    } = req

    if (![FavTagType.tag, FavTagType.groupTag].includes(type)) {
      logger.log({
        message: `Invalid fav tag type provided - ${type}`,
        level: 'warn',
        traceId: res.get('x-traceid'),
      })
      return res.status(400).end()
    }

    let relatedRecord, relatedRecordType: string

    try {
      ;[relatedRecord, relatedRecordType] = await getRelatedTagRecord(tag, type)
    } catch (err) {
      next(err)

      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })
      return
    }

    if (!relatedRecord) {
      return res.status(404).end()
    }

    FavTagModel.create({
      type,
      group,
      owner: req.user.id,
      [relatedRecordType]: relatedRecord._id,
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
      .populate('groupTag')
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
