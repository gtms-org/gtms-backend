require('dotenv').config()

const {
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  PORT,
  DB_HOST,
  VERSION,
  QUEUE_HOST,
  S3_BUCKET,
  AWS_ENDPOINT,
} = process.env

module.exports = {
  port: PORT,
  dbHost: DB_HOST,
  dbName: 'files',
  serviceName: 'files',
  serviceVersion: VERSION,
  queueHost: QUEUE_HOST,
  awsAccessKeyId: AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: AWS_SECRET_ACCESS_KEY,
  awsRegion: AWS_REGION,
  awsEndpoint: AWS_ENDPOINT,
  s3Bucket: S3_BUCKET,
}
