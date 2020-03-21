/* eslint-disable @typescript-eslint/no-var-requires */
const { ObjectID: ObjectId } = require('mongodb')

module.exports = [
  {
    _id: ObjectId(),
    name: 'Brudstoock',
    description: 'Lorem ipsum',
    type: 'default',
    visibility: 'public',
    tags: [],
    members: [],
    owner: ObjectId(),
  },
]
