import { TmpFileModel, ITmpFile } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'
import AWS from 'aws-sdk'
import config from 'config'

AWS.config.update({
  accessKeyId: config.get<string>('awsAccessKeyId'),
  secretAccessKey: config.get<string>('awsSecretAccessKey'),
  region: config.get<string>('awsRegion'),
})

const s3Client = new AWS.S3({
  endpoint: config.get<string>('awsEndpoint'),
})

export function cleanupTmpFiles() {
  const now = new Date()
  const query = {
    createdAt: {
      $lt: new Date(now.getTime() - 3600000), // older than 1h
    },
  }
  TmpFileModel.find(query)
    .then((files: ITmpFile[]) => {
      Promise.all(
        files.map(
          file =>
            new Promise(resolve => {
              s3Client.deleteObject(
                {
                  Bucket: file.bucket,
                  Key: file.file,
                },
                err => {
                  if (err) {
                    logger.log({
                      message: `Can not delete tmp file ${file.file} from bucket ${file.bucket} - ${err}`,
                      level: 'error',
                    })
                  } else {
                    logger.log({
                      message: `Tmp file ${file.file} has been deleted from bucket ${file.bucket}`,
                      level: 'info',
                    })
                  }

                  resolve()
                }
              )
            })
        )
      )
        .then(() => TmpFileModel.deleteMany(query))
        .then(() => {
          logger.log({
            level: 'info',
            message: `Cleanup finished, ${files.length} files have been removed from DB`,
          })
        })
        .catch(err => {
          logger.log({
            message: `Database error: ${err}`,
            level: 'error',
          })
        })
    })
    .catch(err => {
      logger.log({
        message: `Database error: ${err}`,
        level: 'error',
      })
    })
}
