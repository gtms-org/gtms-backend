/* eslint-disable @typescript-eslint/no-var-requires */
const { ObjectID: ObjectId } = require('mongodb')

module.exports = [
  {
    _id: ObjectId(),
    name: 'Brudstoock',
    slug: 'brudstoock',
    description: 'Lorem ipsum',
    type: 'default',
    visibility: 'public',
    tags: [],
    members: [],
    owner: ObjectId(),
  },
  {
    _id: ObjectId(),
    name: 'Opener',
    slug: 'opener',
    description: 'Lorem ipsum',
    type: 'default',
    visibility: 'public',
    tags: [],
    members: [],
    owner: ObjectId('5e53b8e368985486d4a50921'),
  },
]
