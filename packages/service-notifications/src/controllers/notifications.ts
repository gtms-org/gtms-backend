import { Response, NextFunction } from 'express'
import {
  IAuthRequest,
  RecordType,
  arrayToHash,
  getPaginationParams,
} from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { NotificationModel, INotification } from '@gtms/lib-models'
import { findUsersByIds, findGroupsByIds, findPostsByIds } from '@gtms/lib-api'

function prepareResponse(notifications: INotification[], traceId: string) {
  return new Promise((resolve, reject) => {
    const recordsToFetch = notifications.reduce(
      (all, notification) => {
        all[notification.relatedRecordType].push(notification.relatedRecordId)

        return all
      },
      {
        [RecordType.member]: [],
        [RecordType.group]: [],
        [RecordType.post]: [],
        [RecordType.comment]: [],
      }
    )

    Promise.all([
      recordsToFetch.member.length > 0
        ? findUsersByIds(recordsToFetch.member, {
            traceId,
          }).then(records => arrayToHash(records, 'id'))
        : Promise.resolve({}),
      recordsToFetch.group.length > 0
        ? findGroupsByIds(recordsToFetch.group, {
            traceId,
          }).then(records => arrayToHash(records, 'id'))
        : Promise.resolve({}),
      recordsToFetch.post.length > 0
        ? findPostsByIds(recordsToFetch.post, {
            traceId,
          }).then(records => arrayToHash(records, 'id'))
        : Promise.resolve({}),
      Promise.resolve<{ [key: string]: any }>({}), // todo make a request for comments
    ])
      .then(([members, groups, posts, comments]) => {
        resolve(
          notifications
            .map(notification => {
              const basic = {
                notificationType: notification.notificationType,
                isRead: notification.isRead,
                payload: notification.payload,
                createdAt: notification.createdAt,
                updatedAt: notification.updatedAt,
              }

              switch (notification.relatedRecordType) {
                case RecordType.member:
                  if (members[`${notification.relatedRecordId}`]) {
                    return {
                      relatedRecord: members[`${notification.relatedRecordId}`],
                      ...basic,
                    }
                  }

                case RecordType.group:
                  if (groups[`${notification.relatedRecordId}`]) {
                    return {
                      relatedRecord: groups[`${notification.relatedRecordId}`],
                      ...basic,
                    }
                  }

                case RecordType.post:
                  if (posts[`${notification.relatedRecordId}`]) {
                    return {
                      relatedRecord: posts[`${notification.relatedRecordId}`],
                      ...basic,
                    }
                  }

                case RecordType.comment:
                  if (comments[`${notification.relatedRecordId}`]) {
                    return {
                      relatedRecord:
                        comments[`${notification.relatedRecordId}`],
                      ...basic,
                    }
                  }
              }

              return null
            })
            .filter(notification => notification)
        )
      })
      .catch(reject)
  })
}

export default {
  myNotifications(req: IAuthRequest, res: Response, next: NextFunction) {
    NotificationModel.find({
      owner: req.user.id,
      read: false,
    })
      .sort({
        _id: -1,
      })
      .then((notifications: INotification[]) => {
        prepareResponse(notifications, res.get('x-traceid'))
          .then(result => res.status(200).json(result))
          .catch(err => {
            res.status(500).end()

            logger.log({
              message: `API error: ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          })
          .finally(() => {
            NotificationModel.updateMany(
              {
                owner: req.user.id,
              },
              { read: true }
            ).catch(err => {
              logger.log({
                message: `Can not mark user (${req.user.email}) notifications as read, database error - ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })
            })
          })
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
  recent(req: IAuthRequest, res: Response, next: NextFunction) {
    const { limit, offset } = getPaginationParams(req)
    NotificationModel.paginate(
      { owner: req.user.id },
      {
        offset,
        limit,
        sort: {
          _id: -1,
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

        prepareResponse(result.docs, res.get('x-traceid'))
          .then(notifications => {
            res.status(200).json({
              ...result,
              docs: notifications,
            })
          })
          .catch(err => {
            next(err)
            logger.log({
              message: `Database error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          })
          .finally(() => {
            NotificationModel.updateMany(
              {
                owner: req.user.id,
              },
              { read: true }
            ).catch(err => {
              logger.log({
                message: `Can not mark user (${req.user.email}) notifications as read, database error - ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })
            })
          })
      }
    )
  },
}
