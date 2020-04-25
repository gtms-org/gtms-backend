import { FileOperations, FileTypes } from './enums'
import fetch from 'node-fetch'
import sharp from 'sharp'
import AWS from 'aws-sdk'
import config from 'config'

type resizeSizes = [number, number]

interface IFileResizeOperation {
  operation: FileOperations.resize
  size: resizeSizes
}

interface IFileSaveOperation {
  operation: FileOperations.save
  fileType: FileTypes
  name: string
}

export type FileOperation = IFileResizeOperation | IFileSaveOperation

AWS.config.update({
  accessKeyId: config.get<string>('awsAccessKeyId'),
  secretAccessKey: config.get<string>('awsSecretAccessKey'),
  region: config.get<string>('awsRegion'),
})

const s3Client = new AWS.S3({
  endpoint: config.get<string>('awsEndpoint'),
})

const getFilename = (url: string): string => {
  const nameArr = url.split('/')
  const name = nameArr[nameArr.length - 1]

  return name.split('.')[0]
}

const uploadImage = (type: string, fileName: string, file: Buffer) =>
  new Promise((resolve, reject) => {
    if (!config.has(`buckets.${type}`)) {
      return reject(`FileType: ${type} has no bucket associated`)
    }

    const params = {
      Bucket: config.get<string>(`buckets.${type}`),
      Key: fileName,
      Body: file,
    }
    s3Client.upload(
      params,
      async (err: Error | null, data: { Location: string }) => {
        if (err) {
          return reject(err)
        }

        resolve(data.Location)
      }
    )
  })

const fetchImage = (url: string): Promise<Buffer> =>
  fetch(url)
    .then(res => res.arrayBuffer())
    .then(buffer => Buffer.from(buffer))

const resizeFile = (file: sharp.Sharp, size: resizeSizes) => {
  file.resize(size[0], size[1])

  return file
}

const convertFile = (file: sharp.Sharp, type: FileTypes) => {
  switch (type) {
    case FileTypes.jpg:
      return file.jpeg()

    case FileTypes.webp:
      return file.webp()
  }
}

export async function processFile(
  type: string,
  fileUrl: string,
  operations: FileOperation[][]
): Promise<string[]> {
  const fileBuffer = await fetchImage(fileUrl)
  const filename = getFilename(fileUrl)

  const uploads: Promise<any>[] = []

  for (const operationsList of operations) {
    const file = sharp(Buffer.from(fileBuffer))

    for (const operation of operationsList) {
      switch (operation.operation) {
        case FileOperations.resize:
          resizeFile(file, operation.size)
          break

        case FileOperations.save:
          convertFile(file, operation.fileType)
          uploads.push(
            file
              .toBuffer()
              .then(file =>
                uploadImage(
                  type,
                  `${operation.name}-${filename}.${operation.fileType}`,
                  file
                )
              )
          )
          break
      }
    }
  }

  return Promise.all(uploads)
}
