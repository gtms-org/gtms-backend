import {
  GroupTagModel,
  IGroupTag,
  serializeGroupTag,
  ITag,
  TagModel,
} from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import {
  IGenericCreateOperation,
  IGenericCreateOperationResult,
  BulkCreateOperationResult,
  ISerializedGroupTag,
} from '@gtms/commons'

export interface IAddOperation extends IGenericCreateOperation {
  value: {
    tag: string
    description: string
    order?: number
  }
}

export interface ICreateOperationResult extends IGenericCreateOperationResult {
  value?: ISerializedGroupTag
}

export function handleAddOp(
  ops: IAddOperation[],
  group: string,
  options: {
    traceId: string
    userId: string
  }
): Promise<ICreateOperationResult[]> {
  const { traceId, userId } = options
  return Promise.all(
    ops.map(async (op: IAddOperation) => {
      let tag: ITag | null

      try {
        tag = await TagModel.findOne({ name: op.value.tag })
      } catch (err) {
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId,
        })

        return {
          status: BulkCreateOperationResult.error,
        }
      }

      if (!tag) {
        try {
          tag = await TagModel.create({
            name: op.value.tag,
            creator: userId,
            groupsCounter: 1,
            totalCounter: 1,
          })
        } catch (err) {
          logger.log({
            level: 'error',
            message: `Database error: ${err}`,
            traceId,
          })
          return {
            status: BulkCreateOperationResult.error,
          }
        }
      }

      try {
        const groupTag: IGroupTag = await GroupTagModel.create({
          tag,
          description: op.value.description,
          group,
          order: op.value.order || 0,
        })

        return {
          status: BulkCreateOperationResult.created,
          value: serializeGroupTag(groupTag),
        }
      } catch (err) {
        if (err.name === 'ValidationError') {
          return {
            status: BulkCreateOperationResult.validationError,
            errors: err.errors,
          }
        }

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId,
        })

        return {
          status: BulkCreateOperationResult.error,
        }
      }
    })
  )
}
