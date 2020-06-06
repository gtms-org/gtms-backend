import { Response, NextFunction } from 'express'
import { IAuthRequest, randomString, arrayToHash } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import {
  GroupInvitationModel,
  GroupModel,
  GroupMemberModel,
  IGroup,
  IGroupMember,
  IGroupInvitation,
} from '@gtms/lib-models'
import { findUsersByIds } from '@gtms/lib-api'
import config from 'config'
import createError from 'http-errors'

async function createGroupMembershipRequest(
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) {
  const { slug } = req.params

  try {
    const group = await GroupModel.findOne({
      slug,
    })

    if (!group) {
      logger.log({
        level: 'warn',
        message: `User ${req.user.email} tried to request membership access to not existing group ${slug}`,
        traceId: res.get('x-traceid'),
      })

      return res.status(404).end()
    }

    if (group.type === 'public') {
      logger.log({
        level: 'warn',
        message: `User ${req.user.email} tried to request membership access to a public group ${group.name}`,
        traceId: res.get('x-traceid'),
      })

      return res
        .status(400)
        .json({ message: 'Group is public' })
        .end()
    }

    GroupMemberModel.findOne({
      group: group._id,
      user: req.user.id,
    })
      .then((groupMember: IGroupMember | null) => {
        if (groupMember) {
          logger.log({
            level: 'warn',
            message: `User ${req.user.email} tried to request membership access to group ${group.name} but he/she is already a member`,
            traceId: res.get('x-traceid'),
          })

          return res
            .status(400)
            .json({ message: "You are already group's member" })
            .end()
        }

        GroupInvitationModel.findOne({
          group: group._id,
          user: req.user.id,
        })
          .then(record => {
            if (record) {
              return res.status(201).end()
            }

            GroupInvitationModel.create({
              group,
              user: req.user.id,
              type: 'request',
            })
              .then(() => {
                res.status(201).end()
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
          })
          .catch(err => {
            next(err)

            logger.log({
              message: `Database error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
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
  } catch (err) {
    next(err)

    logger.log({
      message: `Database error ${err}`,
      level: 'error',
      traceId: res.get('x-traceid'),
    })
  }
}

function canDeleteInvitation(
  req: IAuthRequest,
  invitation: IGroupInvitation
): boolean {
  if (invitation.user === req.user.id) {
    return true
  }

  if (invitation.group.admins.includes(req.user.id)) {
    return true
  }

  if (invitation.group.owner === req.user.id) {
    return true
  }

  return false
}

async function createInvitationToGroup(
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) {
  const { slug } = req.params
  const { user } = req.body

  if (!user || user === '') {
    return res.status(400).end()
  }

  try {
    const group = await GroupModel.findOne({
      slug,
    })

    if (!group) {
      logger.log({
        level: 'warn',
        message: `User ${req.user.email} tried to create a invitation to not existing group ${slug}`,
        traceId: res.get('x-traceid'),
      })

      return res.status(404).end()
    }

    if (group.owner !== req.user.id || !group.admins.includes(req.user.id)) {
      return res.status(403).end()
    }

    GroupMemberModel.findOne({
      group: group._id,
      user: user,
    })
      .then((groupMember: IGroupMember | null) => {
        if (groupMember) {
          logger.log({
            level: 'warn',
            message: `Admin ${req.user.email} tried to invite user ${user} to group ${group.name}, but that user is already a member`,
            traceId: res.get('x-traceid'),
          })

          return res
            .status(400)
            .json({ message: 'User is already a member' })
            .end()
        }

        GroupInvitationModel.findOne({
          group: group._id,
          user: req.user.id,
        })
          .then(record => {
            if (record) {
              return res.status(201).end()
            }

            GroupInvitationModel.create({
              group,
              user: req.user.id,
              type: 'invitation',
              code: randomString(35),
            })
              .then(() => {
                res.status(201).end()
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
          })
          .catch(err => {
            next(err)

            logger.log({
              message: `Database error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
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
  } catch (err) {
    next(err)

    logger.log({
      message: `Database error ${err}`,
      level: 'error',
      traceId: res.get('x-traceid'),
    })
  }
}

async function getGroupInvitations(
  type: 'invitation' | 'request',
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) {
  const { slug } = req.params

  try {
    const group = await GroupModel.findOne({
      slug,
    })

    if (!group) {
      logger.log({
        level: 'warn',
        message: `User ${req.user.email} tried to fetch invitations to not existing group ${slug}`,
        traceId: res.get('x-traceid'),
      })

      return res.status(404).end()
    }

    if (group.owner !== req.user.id || !group.admins.includes(req.user.id)) {
      return res.status(403).end()
    }

    GroupInvitationModel.find({
      group: group._id,
      type,
    }).then((invitations: IGroupInvitation[]) => {
      if (invitations.length === 0) {
        return res
          .status(200)
          .json([])
          .end()
      }

      findUsersByIds(
        invitations.map(invitation => invitation.user),
        {
          traceId: res.get('x-traceid'),
          appKey: config.get<string>('appKey'),
        }
      )
        .then(users => {
          const usersHash = arrayToHash(users, 'id')

          res.status(200).json(
            invitations
              .map(invitation => {
                if (usersHash[invitation.user]) {
                  return {
                    id: invitation._id,
                    user: usersHash[invitation.user],
                    code: invitation.code,
                    createdAt: invitation.createdAt,
                    updatedAt: invitation.updatedAt,
                  }
                }

                return null
              })
              .filter(invitation => invitation)
          )
        })
        .catch(err => {
          logger.log({
            level: 'error',
            message: `Can not fetch users details, ${err}`,
            traceId: res.get('x-traceid'),
          })

          return next(createError(500))
        })
    })
  } catch (err) {
    next(err)

    logger.log({
      message: `Database error ${err}`,
      level: 'error',
      traceId: res.get('x-traceid'),
    })
  }
}

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const { type } = req.body

    if (!['invitation', 'request'].includes(type)) {
      return res.status(400).end()
    }

    switch (type) {
      case 'invitation':
        return createInvitationToGroup(req, res, next)

      case 'request':
        return createGroupMembershipRequest(req, res, next)
    }
  },
  async groupInvitations(req: IAuthRequest, res: Response, next: NextFunction) {
    return getGroupInvitations('invitation', req, res, next)
  },
  groupRequests(req: IAuthRequest, res: Response, next: NextFunction) {
    return getGroupInvitations('request', req, res, next)
  },
  userInvitations(req: IAuthRequest, res: Response, next: NextFunction) {
    GroupInvitationModel.find({
      user: req.user.id,
    })
      .then((invitations: IGroupInvitation[]) => {
        GroupModel.find({
          _id: {
            $in: invitations.map(i => i.group),
          },
        })
          .then((groups: IGroup[]) => {
            const groupsHash = arrayToHash(groups, 'id')

            res.status(200).json(
              invitations.reduce(
                (all, invitation) => {
                  const group = groupsHash[invitation.group as any]
                  if (group) {
                    const index = `${invitation.type}s` as
                      | 'invitations'
                      | 'requests'

                    all[index].push({
                      id: invitation._id,
                      group,
                      code: invitation.code,
                      createdAt: invitation.createdAt,
                      updatedAt: invitation.updatedAt,
                    })
                  }

                  return all
                },
                {
                  invitations: [],
                  requests: [],
                }
              )
            )
          })
          .catch(err => {
            next(err)

            logger.log({
              message: `Database error ${err}`,
              level: 'error',
              traceId: res.get('x-traceid'),
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
  async deleteInvitation(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    try {
      const invitation = await GroupInvitationModel.findById(id).populate(
        'group'
      )

      if (!invitation) {
        return res.status(404).end()
      }

      if (!canDeleteInvitation(req, invitation)) {
        logger.log({
          level: 'warn',
          message: `User ${req.user.email} tried delete a group's invitation with id ${id} (${invitation.group.name}) without proper permissions`,
          traceId: res.get('x-traceid'),
        })
        return res.status(403).end()
      }

      invitation.remove()

      res.status(200).end()
    } catch (err) {
      next(err)

      logger.log({
        message: `Database error ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })
    }
  },
}
