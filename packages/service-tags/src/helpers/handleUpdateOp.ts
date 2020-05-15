import { GroupTagModel, serializeGroupTag } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import {
  IGenericUpdateOperation,
  IGenericUpdateOperationResult,
  BulkUpdateOperationResult,
  ISerializedGroupTag,
} from '@gtms/commons'

export interface IUpdateOperation extends IGenericUpdateOperation {
  value: {
    description: string
    order?: number
  }
}

export interface IUpdateOperationResult extends IGenericUpdateOperationResult {
  value?: ISerializedGroupTag
}

export function handleUpdateOp(
  ops: IUpdateOperation[],
  group: string,
  traceId: string
): Promise<IUpdateOperationResult[]> {
  return Promise.all(
    ops.map(async (op: IUpdateOperation) => {
      try {
        const groupTag = await GroupTagModel.findOneAndUpdate(
          {
            _id: op.path,
            group,
          },
          op.value,
          { new: true }
        )
        if (!groupTag) {
          return {
            path: op.path,
            status: BulkUpdateOperationResult.notFound,
          }
        }
        return {
          status: BulkUpdateOperationResult.updated,
          path: groupTag._id,
          value: serializeGroupTag(groupTag),
        }
      } catch (err) {
        if (err.name === 'ValidationError') {
          return {
            path: op.path,
            status: BulkUpdateOperationResult.validationError,
            errors: err.errors,
          }
        }
        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId,
        })
        return {
          path: op.path,
          status: BulkUpdateOperationResult.error,
        }
      }
    })
  )
}
