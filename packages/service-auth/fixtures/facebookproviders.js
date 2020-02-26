/* eslint-disable @typescript-eslint/no-var-requires */
const { ObjectID: ObjectId } = require('mongodb')

module.exports = [
  {
    _id: ObjectId(),
    user: ObjectId('5e53b8e368985486d4a50924'),
    accessToken: 'fake-fb-token',
    id: 'fake-user',
    name: 'Fake User',
  },
]
