import { Request, Response, NextFunction } from 'express'
import { IAuthRequest } from '@gtms/commons'
import {
  GroupTagModel,
  IGroupTag,
  TagModel,
  serializeGroupTag,
} from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import { hasGroupAdminRights } from '@gtms/lib-api'
import config from 'config'

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const { body } = req

    Promise.all([
      TagModel.findOne({ name: body.tag }),
      hasGroupAdminRights(req.user.id, body.group, {
        traceId: res.get('x-traceid'),
        appKey: config.get<string>('appKey'),
      }),
    ])
      .then(async results => {
        let [tag] = results

        if (!tag) {
          try {
            tag = await TagModel.create({
              name: body.tag,
              creator: req.user.id,
              groupsCounter: 1,
              totalCounter: 1,
            })
          } catch (err) {
            next(err)

            logger.log({
              level: 'error',
              message: `Database error: ${err}`,
              traceId: res.get('x-traceid'),
            })
            return
          }
        }

        GroupTagModel.create({
          tag,
          description: body.description,
          group: body.group,
          order: body.order || 0,
        })
          .then((groupTag: IGroupTag) => {
            res.status(201).json(serializeGroupTag(groupTag))
          })
          .catch(err => {
            next(err)

            logger.log({
              message: `Database error: ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          })
      })
      .catch(err => {
        logger.log({
          level: 'error',
          message: `Error occurred during Group Tag record creation: ${err}`,
          traceId: res.get('x-traceid'),
        })

        // most probably user has no rights
        res.status(401).end()
      })
  },
}
