import {
  IUser,
  UserModel,
  serializeUser,
  FavGroupModel,
} from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import { Response, NextFunction } from 'express'
import {
  IAuthRequest,
  ITagsUpdateMsg,
  RecordType,
  Queues,
  getPaginationParams,
} from '@gtms/commons'
import { publishOnChannel } from '@gtms/client-queue'
import { findGroupsByIds } from '@gtms/lib-api'
import config from 'config'

export default {
  updateAccount(req: IAuthRequest, res: Response, next: NextFunction) {
    UserModel.findById(req.user.id)
      .then(async (user: IUser | null) => {
        if (!user) {
          logger.log({
            message: `Someone tried to update not existing user account ${req.user.id} ${req.user.email}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          return res.status(404).end()
        }

        ;[
          'name',
          'surname',
          'email',
          'phone',
          'countryCode',
          'languageCode',
          'tags',
        ].forEach(
          (
            field:
              | 'name'
              | 'surname'
              | 'email'
              | 'phone'
              | 'countryCode'
              | 'languageCode'
              | 'tags'
          ) => {
            if (req.body[field]) {
              user[field] = req.body[field]
            }
          }
        )

        try {
          user.save()

          logger.log({
            level: 'info',
            message: `Account ${user._id} (${user.email}) has been updated`,
            traceId: res.get('x-traceid'),
          })

          res.status(200).json(serializeUser(user))
        } catch (err) {
          if (err.name === 'ValidationError') {
            logger.log({
              message: `Validation error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
            return res.status(400).json(err.errors)
          } else {
            next(err)

            logger.log({
              message: `Request error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
            return
          }
        }

        // publish info about tags used with user's account
        if (Array.isArray(req.body.tags) && req.body.tags.length > 0) {
          try {
            await publishOnChannel<ITagsUpdateMsg>(Queues.updateTags, {
              recordType: RecordType.member,
              data: {
                tags: user.tags,
                traceId: res.get('x-traceid'),
                owner: user._id,
              },
            })

            logger.log({
              message: `User's tags list has been published to the queue`,
              level: 'info',
              traceId: res.get('x-traceid'),
            })
          } catch (err) {
            logger.log({
              message: `Can not publish message to the QUEUE: ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
            })
          }
        }
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  getAccount(req: IAuthRequest, res: Response, next: NextFunction) {
    UserModel.findById(req.user.id)
      .then(async (user: IUser | null) => {
        if (!user) {
          logger.log({
            message: `Someone tried to get information about not existing user account ${req.user.id} ${req.user.email}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          return res.status(404).end()
        }

        res.status(200).json({
          ...serializeUser(user),
          groupsMember: user.groupsMember,
          groupsAdmin: user.groupsAdmin,
          groupsOwner: user.groupsOwner,
        })
      })
      .catch(err => {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
  getGroups(req: IAuthRequest, res: Response, next: NextFunction) {
    const { limit, offset } = getPaginationParams(req)
    Promise.all([
      UserModel.findById(req.user.id),
      FavGroupModel.paginate(
        {
          owner: req.user.id,
        },
        {
          offset,
          limit,
          sort: {
            order: 'asc',
          },
        }
      ),
    ])
      .then(async ([user, favGroups]) => {
        if (!user) {
          logger.log({
            message: `Someone tried to get information about not existing user account ${req.user.id} ${req.user.email}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          return res.status(404).end()
        }

        const groupIds = [...(user.groupsMember || [])]

        if (Array.isArray(user.groupsAdmin) && user.groupsAdmin.length > 0) {
          groupIds.push(
            ...user.groupsAdmin.filter(id => !groupIds.includes(id))
          )
        }

        if (Array.isArray(user.groupsOwner) && user.groupsOwner.length > 0) {
          groupIds.push(
            ...user.groupsOwner.filter(id => !groupIds.includes(id))
          )
        }

        if (favGroups.docs.length > 0) {
          groupIds.push(
            ...favGroups.docs
              .filter(fav => !groupIds.includes(fav.group))
              .map(fav => fav.group)
          )
        }

        if (groupIds.length > 0) {
          try {
            const groups: { id: string }[] = await findGroupsByIds(groupIds, {
              traceId: res.get('x-traceid'),
            })

            const findGroup = (id: string) =>
              groups.find(group => group.id === id + '')
            const filterGroups = (group?: { id: string }) => group !== undefined

            res.status(200).json({
              admin: user.groupsAdmin.map(findGroup).filter(filterGroups),
              member: user.groupsMember.map(findGroup).filter(filterGroups),
              owner: user.groupsOwner.map(findGroup).filter(filterGroups),
              favs: {
                ...favGroups,
                dosc: favGroups.docs
                  .map(fav =>
                    groups.find(group => `${group.id}` === `${fav.group}`)
                  )
                  .filter(filterGroups),
              },
            })
          } catch (err) {
            res.status(500).end()

            logger.log({
              level: 'error',
              message: `Can not fetch groups info: ${err}`,
              traceId: res.get('x-traceid'),
            })
          }
        } else {
          res.status(200).json({
            admin: [],
            member: [],
            owner: [],
            favs: favGroups,
          })
        }
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
