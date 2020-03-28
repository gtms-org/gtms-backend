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
  {
    _id: ObjectId(),
    user: ObjectId('5e53b8e368985486d4a50985'),
    accessToken: 'fake-fb-token-2',
    id: 'fake-user-2',
    name: 'facebook user',
  },
  {
    _id: ObjectId(),
    user: ObjectId('5e53b8e368985486d4a50986'),
    accessToken: 'fake-fb-blocked-token',
    id: 'fake-blocked-user',
    name: 'facebook user',
  },
  {
    _id: ObjectId(),
    user: ObjectId('5e53b8e368985486d4a50987'),
    accessToken: 'fake-fb-not-active-token',
    id: 'fake-not-active-user',
    name: 'facebook user',
  },
]
