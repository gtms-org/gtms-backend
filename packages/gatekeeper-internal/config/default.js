/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

const {
  AUTH_SERVICE_URL,
  GROUPS_SERVICE_URL,
  AUTH_SERVICE_KEY,
  GROUPS_SERVICE_KEY,
  TAGS_SERVICE_KEY,
  TAGS_WORKER_KEY,
  COMMENTS_SERVICE_KEY,
  POSTS_SERVICE_KEY,
  VERSION,
  PORT,
} = process.env

module.exports = {
  serviceName: 'gatekeeper-internal',
  serviceVersion: VERSION,
  services: {
    auth: `http://${AUTH_SERVICE_URL}`,
    groups: `http://${GROUPS_SERVICE_URL}`,
  },
  appKeys: {
    auth: AUTH_SERVICE_KEY,
    groups: GROUPS_SERVICE_KEY,
    tags: TAGS_SERVICE_KEY,
    tagsWorker: TAGS_WORKER_KEY,
    posts: POSTS_SERVICE_KEY,
    comments: COMMENTS_SERVICE_KEY,
  },
  port: PORT,
}
