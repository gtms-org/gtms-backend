import { FileTypes, FileStatus, IAuthRequest } from '@gtms/commons'
import { Response, NextFunction } from 'express'
import logger from '@gtms/lib-logger'
import { UploadedFile } from 'express-fileupload'
import AWS from 'aws-sdk'
import config from 'config'
import { publishOnChannel } from '@gtms/client-queue'
import {
  FILES_QUEUE_MAPPER,
  IFileQueueMsg,
  IDeleteFileQueueMsg,
  Queues,
} from '@gtms/commons'
import { TmpFileModel, ITmpFile } from '@gtms/lib-models'

AWS.config.update({
  accessKeyId: config.get<string>('awsAccessKeyId'),
  secretAccessKey: config.get<string>('awsSecretAccessKey'),
  region: config.get<string>('awsRegion'),
})

const s3Client = new AWS.S3({
  endpoint: config.get<string>('awsEndpoint'),
})

export function getCreateTmpFileAction(relatedRecordType?: string) {
  return async (req: IAuthRequest, res: Response, next: NextFunction) => {
    if (!req.files) {
      return res
        .status(400)
        .json({
          files: 'no files were uploaded',
        })
        .end()
    }

    const userTmpFileCount = await TmpFileModel.countDocuments({
      owner: req.user.id,
    })

    if (userTmpFileCount > 25) {
      logger.log({
        level: 'warn',
        message: `User ${req.user.id} (${req.user.email}) exceeded tmp files limit (25), current number of tmp files for that user - ${userTmpFileCount}`,
        traceId: res.get('x-traceid'),
      })

      return res
        .status(400)
        .json({
          file: 'too many uploaded files',
        })
        .end()
    }

    const fileToUpload = req.files.file as UploadedFile

    const params = {
      Bucket: config.get<string>('s3Bucket'),
      Key: `${new Date().getTime()}-${fileToUpload.name}`,
      Body: fileToUpload.data,
      ACL: 'public-read',
    }

    s3Client.upload(params, async (err: Error | null, data: any) => {
      if (err) {
        logger.log({
          level: 'error',
          message: `Error during s3 upload: ${err}`,
          traceId: res.get('x-traceid'),
        })

        return next(err)
      }

      res.status(201).json({
        url: data.Location,
      })

      TmpFileModel.create({
        owner: req.user.id,
        file: params.Key,
        bucket: params.Bucket,
        url: data.Location,
        relatedRecordType,
      })
        .then(() => {
          logger.log({
            message: `TmpFile record has been created`,
            level: 'info',
            traceId: res.get('x-traceid'),
          })
        })
        .catch(err => {
          logger.log({
            message: `Database error: ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        })
    })
  }
}

export function getCreateFileAction(fileType: FileTypes) {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    if (!req.files) {
      return res.status(400).json({
        files: 'no files were uploaded',
      })
    }
    const { body } = req

    if (!body.relatedRecord) {
      return res
        .status(400)
        .json({
          relatedRecord: 'required',
        })
        .end()
    }

    const fileToUpload = req.files.file as UploadedFile

    const params = {
      Bucket: config.get<string>('s3Bucket'),
      Key: `${new Date().getTime()}-${fileToUpload.name}`,
      Body: fileToUpload.data,
      ACL: 'public-read',
    }

    s3Client.upload(params, async (err: Error | null, data: any) => {
      if (err) {
        logger.log({
          level: 'error',
          message: `Error during s3 upload: ${err}`,
          traceId: res.get('x-traceid'),
        })

        return next(err)
      }

      // publish info about new file on queue
      try {
        const file = {
          relatedRecord: body.relatedRecord,
          status: FileStatus.uploaded,
          fileType,
          owner: req.user.id,
          files: [
            {
              url: data.Location,
            },
          ],
          traceId: res.get('x-traceid'),
        }
        await publishOnChannel<IFileQueueMsg>(FILES_QUEUE_MAPPER[fileType], {
          data: file,
        })

        res.status(201).end()

        logger.log({
          message: `Info about file ${JSON.stringify(
            file
          )}) - creation - has been published to the queue`,
          level: 'info',
          traceId: res.get('x-traceid'),
        })
      } catch (err) {
        logger.log({
          message: `Can not publish message to the QUEUE: ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })

        next(err)
      }
    })
  }
}

export function deleteTempFile(
  req: IAuthRequest,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params

  TmpFileModel.findOneAndDelete({
    _id: id,
    owner: req.user.id,
  })
    .then(async (file: ITmpFile | null) => {
      if (!file) {
        return res.status(404).end()
      }

      logger.log({
        message: `Tmp file with id ${id} has been removed from DB by user ${req.user.email} (${req.user.id})`,
        level: 'info',
        traceId: res.get('x-traceid'),
      })

      res.status(200).end()

      try {
        await publishOnChannel<IDeleteFileQueueMsg>(Queues.deleteFile, {
          data: {
            traceId: res.get('x-traceid'),
            bucket: file.bucket,
            file: file.file,
          },
        })

        logger.log({
          message: `Delete file message has been sent to queue ${Queues.deleteFile}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      } catch (err) {
        logger.log({
          message: `Can not send delete file message to queue ${Queues.deleteFile} - ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      }
    })
    .catch(err => {
      logger.log({
        level: 'error',
        message: `Database error: ${err}`,
        traceId: res.get('x-traceid'),
      })

      next(err)
    })
}
