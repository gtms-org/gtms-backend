import { IESCommentMsg, ESIndexUpdateType, Indicies } from '@gtms/commons'
import { client } from '../esClient'
import logger from '@gtms/lib-logger'
import { RequestParams } from '@elastic/elasticsearch'

export const processCommentMsg = (msg: IESCommentMsg): Promise<void> =>
  new Promise((resolve, reject) => {
    switch (msg.type) {
      case ESIndexUpdateType.create:
        const dataToIndex: RequestParams.Index = {
          index: Indicies.COMMENTS_INDEX,
          body: msg.data,
        }
        client
          .index(dataToIndex)
          .then(response => {
            logger.log({
              level: 'info',
              message: `Elasticserach indexed a comment: ${response}`,
              traceId: msg.data.traceId,
            })

            resolve()
          })
          .catch(err => {
            logger.log({
              level: 'info',
              message: `Elasticserach error: ${err}`,
              traceId: msg.data.traceId,
            })

            reject('es error')
          })
        break

      case ESIndexUpdateType.update:
        const dataToUpdate: RequestParams.UpdateByQuery = {
          index: Indicies.COMMENTS_INDEX,
          refresh: true,
          body: {
            script: {
              inline:
                'for (i in params.keySet()) { ctx._source[i] = params.get(i);}',
              lang: 'painless',
              params: msg.data,
            },
            query: {
              match: {
                id: msg.data.id,
              },
            },
          },
        }
        client
          .updateByQuery(dataToUpdate)
          .then(response => {
            logger.log({
              level: 'info',
              message: `Elasticserach updated comment: ${response}`,
              traceid: msg.data.traceId,
            })

            resolve()
          })
          .catch(err => {
            logger.log({
              level: 'info',
              message: `Elasticserach error: ${err}`,
              traceId: msg.data.traceId,
            })

            reject('es error')
          })
        break

      case ESIndexUpdateType.delete:
        reject('Delete operation is not yet supported')
        break
    }
  })
