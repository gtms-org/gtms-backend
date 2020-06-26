import mongoose from 'mongoose'

export function validateObjectId(toCheck: any) {
  return mongoose.Types.ObjectId.isValid(toCheck)
}
