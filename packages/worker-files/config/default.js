/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

const {
  QUEUE_HOST,
  DB_HOST,
  VERSION,
  PORT,
  BUCKET_GROUP_LOGO,
  BUCKET_AVATAR,
  BUCKET_GROUP_BG,
  BUCKET_GROUP_COVER,
  BUCKET_USER_GALLERY,
  BUCKET_GROUP_TAG_LOGO,
  BUCKET_POST_IMAGE,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY,
  AWS_REGION,
  AWS_ENDPOINT,
  CONSUL_HOST,
  CONSUL_PORT,
} = process.env

module.exports = {
  port: PORT,
  queueHost: QUEUE_HOST,
  dbHost: DB_HOST,
  dbName: 'files',
  serviceName: 'worker-files',
  serviceVersion: VERSION,
  awsAccessKeyId: AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: AWS_SECRET_ACCESS_KEY,
  awsRegion: AWS_REGION,
  awsEndpoint: AWS_ENDPOINT,
  consulHost: CONSUL_HOST,
  consulPort: CONSUL_PORT,
  buckets: {
    groupLogo: BUCKET_GROUP_LOGO,
    avatar: BUCKET_AVATAR,
    userGallery: BUCKET_USER_GALLERY,
    groupBg: BUCKET_GROUP_BG,
    groupTagLogo: BUCKET_GROUP_TAG_LOGO,
    postImage: BUCKET_POST_IMAGE,
    groupCover: BUCKET_GROUP_COVER,
  },
  files: {
    groupLogo: [
      [
        {
          operation: 'save',
          fileType: 'jpg',
          name: 'origin',
        },
      ],
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
    avatar: [
      [
        {
          operation: 'save',
          fileType: 'jpg',
          name: 'origin',
        },
      ],
      [
        {
          operation: 'resize',
          size: [1300, 1300],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '1300x1300',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '1300x1300',
        },
      ],
      [
        {
          operation: 'resize',
          size: [800, 800],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '800x800',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '800x800',
        },
      ],
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
    userGallery: [
      [
        {
          operation: 'save',
          fileType: 'jpg',
          name: 'origin',
        },
      ],
      [
        {
          operation: 'resize',
          size: [1300, 1300],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '1300x1300',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '1300x1300',
        },
      ],
      [
        {
          operation: 'resize',
          size: [800, 800],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '800x800',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '800x800',
        },
      ],
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
    groupTagLogo: [
      [
        {
          operation: 'save',
          fileType: 'jpg',
          name: 'origin',
        },
      ],
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
    postImage: [
      [
        {
          operation: 'save',
          fileType: 'jpg',
          name: 'origin',
        },
      ],
      [
        {
          operation: 'resize',
          size: [1300, 1300],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '1300x1300',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '1300x1300',
        },
      ],
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
    ],
    groupCover: [
      [
        {
          operation: 'save',
          fileType: 'jpg',
          name: 'origin',
        },
      ],
      [
        {
          operation: 'resize',
          size: [685, 300],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '685x300',
        },
        {
          operation: 'save',
          fileType: 'webp',
          name: '685x300',
        },
      ],
    ],
    groupBg: [
      [
        {
          operation: 'save',
          fileType: 'jpg',
          name: 'origin',
        },
      ],
      [
        {
          operation: 'resize',
          size: [640, 480],
        },
        {
          operation: 'save',
          fileType: 'jpg',
          name: '685x300',
        },
      ],
    ],
  },
}
