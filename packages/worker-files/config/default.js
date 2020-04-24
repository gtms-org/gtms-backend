/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

const {
  QUEUE_HOST,
  VERSION,
  PORT,
  BUCKET_GROUP_LOGO,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_ENDPOINT,
} = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  serviceName: 'worker-files',
  serviceVersion: VERSION,
  awsAccessKeyId: AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: AWS_SECRET_ACCESS_KEY,
  awsRegion: AWS_REGION,
  awsEndpoint: AWS_ENDPOINT,
  buckets: {
    groupLogo: BUCKET_GROUP_LOGO,
  },
  files: {
    groupLogo: [
      [
        {
          operation: 'resize',
          size: [200, 200],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '200x200',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '200x200',
        },
      ],
      [
        {
          operation: 'resize',
          size: [50, 50],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '50x50',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '50x50',
        },
      ],
      [
        {
          operation: 'resize',
          size: [35, 35],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '35x35',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '35x35',
        },
      ],
    ],
  },
}
