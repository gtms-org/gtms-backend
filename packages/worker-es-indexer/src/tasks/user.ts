import { IESUserMsg } from '@gtms/commons'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const processUserMsg = (msg: IESUserMsg): Promise<void> =>
  new Promise((_resolve, reject) => {
    reject('users are not yet supported')
  })
