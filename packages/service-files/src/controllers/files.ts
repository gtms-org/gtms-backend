import { FileTypes, FileStatus, IAuthRequest } from '@gtms/commons'
import { Response, NextFunction } from 'express'
import FileModel, { IFile } from '../models/files'
import logger from '@gtms/lib-logger'
import { UploadedFile } from 'express-fileupload'
import AWS from 'aws-sdk'
import config from 'config'
import { publishOnChannel } from '@gtms/client-queue'
import { Queues, IFileQueueMsg } from '@gtms/commons'

AWS.config.update({
  accessKeyId: config.get<string>('awsAccessKeyId'),
  secretAccessKey: config.get<string>('awsSecretAccessKey'),
  region: config.get<string>('awsRegion'),
})

const s3Client = new AWS.S3({
  endpoint: config.get<string>('awsEndpoint'),
})

export function getCreateFileAction(fileType: FileTypes) {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    if (!req.files) {
      return res.status(400).json({
        files: 'no files were uploaded',
      })
    }
    const { body } = req

    FileModel.create({
      fileType,
      owner: req.user.id,
      title: body.title,
      relatedRecord: body.relatedRecord,
      status: FileStatus.new,
    })
      .then((file: IFile) => {
        const fileToUpload = req.files.file as UploadedFile

        const params = {
          Bucket: config.get<string>('s3Bucket'),
          Key: `${file._id}-${fileToUpload.name}`,
          Body: fileToUpload.data,
          ACL: 'public-read',
        }

        s3Client.upload(params, async (err: Error | null, data: any) => {
          if (err) {
            logger.log({
              level: 'error',
              message: `Error during s3 upload: ${err} / file: ${file.toJSON()}`,
            })
            try {
              await FileModel.deleteOne({ _id: file._id })
            } catch (dbErr) {
              logger.log({
                level: 'error',
                message: `Can not delete ${file.toJSON()} file record. Error: ${dbErr}`,
                traceId: res.get('x-traceid'),
              })
              return next(dbErr)
            }
            return next(err)
          }

          file.status = FileStatus.uploaded
          file.files = [
            {
              url: data.Location,
            },
          ]

          try {
            await file.save()
          } catch (err) {
            logger.log({
              level: 'error',
              message: `Database error during file record update: ${file.toJSON()} / Error: ${err}`,
              traceId: res.get('x-traceid'),
            })

            return next(err)
          }

          res.status(201).end()

          // publish info about new file on queue
          try {
            await publishOnChannel<IFileQueueMsg>(Queues.createFile, {
              data: {
                ...file.toObject(),
                traceId: res.get('x-traceid'),
              },
            })

            logger.log({
              message: `Info about file ${JSON.stringify(
                file.toJSON()
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
          }
        })
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
            message: `Request error ${err}`,
            level: 'error',
            traceId: res.get('x-traceid'),
          })
        }
      })
  }
}
