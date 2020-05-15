import { GroupTagModel } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import {
  IGenericDeleteOperation,
  BulkDeleteOperationResult,
  IGenericDeleteOperationResult,
} from '@gtms/commons'

export function handleDeleteOp(
  ops: IGenericDeleteOperation[],
  group: string,
  traceId: string
): Promise<IGenericDeleteOperationResult[]> {
  return Promise.all(
    ops.map((op: IGenericDeleteOperation) => {
      return GroupTagModel.deleteOne({
        _id: op.path,
        group,
      })
        .then(result => {
          if (result.deletedCount > 1) {
            return {
              path: op.path,
              status: BulkDeleteOperationResult.deleted,
            }
          }
          return {
            path: op.path,
            status: BulkDeleteOperationResult.notFound,
          }
        })
        .catch(err => {
          logger.log({
            message: `Database error ${err}`,
            level: 'error',
            traceId,
          })

          return {
            path: op.path,
            status: BulkDeleteOperationResult.error,
          }
        })
    })
  )
}
