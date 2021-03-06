import { Response, NextFunction } from 'express'
import {
  IAuthRequest,
  IGenericDeleteOperation,
  BulkOperationTypes,
  Queues,
  IUpdateGroupTagsMsq,
  GroupUpdateTypes,
  FileStatus,
  IFileQueueMsg,
  FileTypes,
} from '@gtms/commons'
import {
  GroupTagModel,
  IGroupTag,
  TagModel,
  serializeGroupTag,
  ITag,
} from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import { hasGroupAdminRights } from '@gtms/lib-api'
import { publishOnChannel } from '@gtms/client-queue'
import {
  IAddOperation,
  IUpdateOperation,
  handleAddOp,
  handleDeleteOp,
  handleUpdateOp,
} from '../helpers'

type IOperation = IAddOperation | IUpdateOperation | IGenericDeleteOperation

export default {
  create(req: IAuthRequest, res: Response, next: NextFunction) {
    const { body } = req

    const errors: string[] = []
    ;['tag', 'group', 'description'].forEach(field => {
      if (!body[field]) {
        errors.push(field)
      }
    })

    if (errors.length > 0) {
      return res.status(400).json(
        errors.reduce((response: any, error) => {
          response[error] = {
            message: `Field ${error} is required`,
            name: 'required',
            properties: {
              message: `Field ${error} is required`,
              type: 'required',
              path: error,
            },
          }

          return response
        }, {})
      )
    }

    Promise.all([
      TagModel.findOne({ name: body.tag }),
      hasGroupAdminRights(req.user.id, body.group, {
        traceId: res.get('x-traceid'),
      }),
    ]).then(async results => {
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

      GroupTagModel.findOne({
        tag,
        group: body.group,
      })
        .then((group: IGroupTag | null) => {
          if (group) {
            return res.status(400).json({
              tag: {
                message: `Field tag has to be unique`,
                name: 'unique',
                properties: {
                  message: `Field tag has to be unique`,
                  type: 'required',
                  path: 'tag',
                },
              },
            })
          }

          const newGrouptagPayload: {
            tag: ITag
            description: string
            group: string
            order: number
            logo?: {
              status: FileStatus
              files: string[]
            }
          } = {
            tag,
            description: body.description,
            group: body.group,
            order: body.order || 0,
          }

          if (body.file) {
            newGrouptagPayload.logo = {
              status: FileStatus.uploaded,
              files: [body.file.url],
            }
          }

          GroupTagModel.create(newGrouptagPayload)
            .then((groupTag: IGroupTag) => {
              res.status(201).json(serializeGroupTag(groupTag))

              return groupTag
            })
            .catch(err => {
              next(err)

              logger.log({
                message: `Database error: ${err}`,
                level: 'error',
                traceId: res.get('x-traceid'),
              })
            })
            .then((groupTag: IGroupTag) => {
              try {
                publishOnChannel<IFileQueueMsg>(Queues.createFile, {
                  data: {
                    relatedRecord: groupTag._id,
                    status: FileStatus.uploaded,
                    fileType: FileTypes.groupTagLogo,
                    owner: req.user.id,
                    files: [
                      {
                        url: body.file.url,
                      },
                    ],
                    traceId: res.get('x-traceid'),
                    extra: {
                      tmpFile: body.file.id,
                    },
                  },
                })
                logger.log({
                  message: `Info about group tag logo file has been sent to queue ${Queues.createFile}`,
                  level: 'info',
                  traceId: res.get('x-traceid'),
                })
              } catch (err) {
                logger.log({
                  message: `Can not send info about group tag logo file to the queue ${Queues.createFile} error - ${err}`,
                  level: 'error',
                  traceId: res.get('x-traceid'),
                })
              }
            })
            .then(async () => {
              try {
                publishOnChannel<IUpdateGroupTagsMsq>(Queues.groupUpdate, {
                  type: GroupUpdateTypes.updateTags,
                  data: {
                    group: body.group,
                    traceId: res.get('x-traceid'),
                    tags: [body.tag],
                  },
                })

                logger.log({
                  message: `Update group's tags message for ${body.group} (tag: ${body.tag}) has been sent to the queue ${GroupUpdateTypes.updateTags}`,
                  level: 'info',
                  traceId: res.get('x-traceid'),
                })
              } catch (err) {
                logger.log({
                  message: `Can not send update group's tags message to the queue ${GroupUpdateTypes.updateTags} - ${err}`,
                  level: 'error',
                  traceId: res.get('x-traceid'),
                })
              }
            })
        })
        .catch(err => {
          logger.log({
            level: 'error',
            message: `Error occurred during Group Tag record creation: ${err}`,
            traceId: res.get('x-traceid'),
          })

          // most probably user has no rights
          res.status(403).end()
        })
    })
  },
  async update(req: IAuthRequest, res: Response, next: NextFunction) {
    const { body } = req
    const { id } = req.params

    const errors: string[] = []
    ;['description'].forEach(field => {
      if (!body[field]) {
        errors.push(field)
      }
    })

    if (errors.length > 0) {
      return res.status(400).json(
        errors.reduce((response: any, error) => {
          response[error] = {
            message: `Field ${error} is required`,
            name: 'required',
            properties: {
              message: `Field ${error} is required`,
              type: 'required',
              path: error,
            },
          }

          return response
        }, {})
      )
    }

    let groupTag: IGroupTag | null
    try {
      groupTag = await GroupTagModel.findOne({ _id: id })
    } catch (err) {
      logger.log({
        message: `Database error: ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }

    if (!groupTag) {
      return res.status(404).end()
    }

    hasGroupAdminRights(req.user.id, groupTag.group, {
      traceId: res.get('x-traceid'),
    })
      .then(async () => {
        groupTag.description = body.description

        const order = parseInt(body.order, 10)

        if (Number.isInteger(order) && order > -1) {
          groupTag.order = order
        }

        try {
          groupTag.save()

          res
            .status(200)
            .json(serializeGroupTag(groupTag))
            .end()
        } catch (err) {
          logger.log({
            message: `Database error: ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          next(err)
        }
      })
      .catch(() => {
        logger.log({
          level: 'warn',
          message: `User ${req.user.email} tried to update group's tag ${groupTag._id} for group that does not belong to him`,
          traceId: res.get('x-traceid'),
        })
        res.status(403).end()
      })
  },
  async deleteGroupTag(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params
    let groupTag: IGroupTag | null

    try {
      groupTag = await GroupTagModel.findOne({ _id: id })
    } catch (err) {
      logger.log({
        message: `Database error: ${err}`,
        level: 'error',
        traceId: res.get('x-traceid'),
      })

      return next(err)
    }

    if (!groupTag) {
      return res.status(404).end()
    }

    hasGroupAdminRights(req.user.id, groupTag.group, {
      traceId: res.get('x-traceid'),
    })
      .then(async () => {
        try {
          await groupTag.remove()

          res.status(200).end()
        } catch (err) {
          logger.log({
            message: `Database error: ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })

          next(err)
        }
      })
      .catch(() => {
        logger.log({
          level: 'warn',
          message: `User ${req.user.email} tried to delete group's tag ${groupTag._id} for group that does not belong to him`,
          traceId: res.get('x-traceid'),
        })
        res.status(403).end()
      })
  },
  async batchUpdate(req: IAuthRequest, res: Response) {
    const { id } = req.params
    const { body } = req

    if (!Array.isArray(body)) {
      return res.status(400).end()
    }

    const addOperations: IAddOperation[] = []
    const updateOperations: IUpdateOperation[] = []
    const deleteOperations: IGenericDeleteOperation[] = []

    for (const operation of body) {
      switch ((operation as IOperation).op) {
        case BulkOperationTypes.create:
          addOperations.push(operation)
          break

        case BulkOperationTypes.update:
          updateOperations.push(operation)
          break

        case BulkOperationTypes.delete:
          deleteOperations.push(operation)
          break
      }
    }

    if (
      addOperations.length === 0 &&
      updateOperations.length === 0 &&
      deleteOperations.length === 0
    ) {
      return res.status(400).end()
    }

    hasGroupAdminRights(req.user.id, id, {
      traceId: res.get('x-traceid'),
    })
      .then(async () => {
        Promise.all([
          handleAddOp(addOperations, id, {
            traceId: res.get('x-traceid'),
            userId: req.user.id,
          }),
          handleUpdateOp(updateOperations, id, res.get('x-traceid')),
          handleDeleteOp(deleteOperations, id, res.get('x-traceid')),
        ])
          .then(([created, updated, deleted]) => {
            return res.status(200).json([...created, ...updated, ...deleted])
          })
          .catch(err => {
            logger.log({
              level: 'error',
              message: `Error during bulk update ${err}`,
              traceId: res.get('x-traceid'),
            })
            res.status(500).end()
          })
      })
      .catch(() => {
        logger.log({
          level: 'warn',
          message: `User ${req.user.email} tried to bulk update group's tag ${id} that does not belong to him`,
          traceId: res.get('x-traceid'),
        })
        res.status(403).end()
      })
  },
  async getGroupTags(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    GroupTagModel.find({
      group: id,
    })
      .populate('tag')
      .sort({
        order: 'asc',
      })
      .then((results: IGroupTag[]) => {
        res.status(200).json(results.map(r => serializeGroupTag(r)))
      })
      .catch(err => {
        logger.log({
          message: `Database error: ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      })
  },
}
