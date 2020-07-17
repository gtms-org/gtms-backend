import { UserModel } from '@gtms/lib-models'
import { randomString } from '@gtms/commons'

async function findRandomUsername(limit = 3): Promise<string> {
  for (let x = 0; x < limit; x++) {
    const username = randomString(8)

    const user = await UserModel.findOne({
      username,
    })

    if (!user) {
      return username
    }
  }

  throw new Error('can not find not existing, random nickname')
}

async function findUsername(
  username: string,
  start: number,
  limit = 3
): Promise<string> {
  for (let x = start; x <= start + limit; x++) {
    const usernameToCheck = `${username}${x}`
    const counter = await UserModel.countDocuments({
      username: usernameToCheck,
    })

    if (counter === 0) {
      return usernameToCheck
    }
  }

  return findRandomUsername(limit)
}

export function generateRandomUsername(
  name?: string,
  surname?: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let usernameProposal: string = name ? name.toLowerCase() : ''

    if (surname) {
      usernameProposal +=
        usernameProposal.length === 0
          ? surname.toLowerCase()
          : `${surname[0].toUpperCase()}${surname.slice(1).toLowerCase()}`
    }

    if (usernameProposal) {
      UserModel.countDocuments({
        username: new RegExp(`${usernameProposal}.*`),
      })
        .then(async (counter: number) => {
          if (counter === 0) {
            return resolve(name)
          }

          try {
            resolve(await findUsername(usernameProposal, counter + 1))
          } catch (err) {
            reject(err)
          }
        })
        .catch(reject)
    } else {
      findRandomUsername(3)
        .then(resolve)
        .catch(reject)
    }
  })
}
