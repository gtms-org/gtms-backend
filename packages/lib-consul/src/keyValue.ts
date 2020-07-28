import { consul } from './consul'
import logger from '@gtms/lib-logger'

export class KeyValueStorage {
  private cache: { [key: string]: any } = {}

  constructor(keysToFetch: string[]) {
    consul.kv.get
  }

  public get<T>(key: string): Promise<T> {
    if (this.cache[key]) {
      return Promise.resolve(this.cache[key])
    }

    return new Promise((resolve, reject) => {
      consul.kv.get(key, (err, result: string | T) => {
        if (err) {
          return reject(err)
        }

        try {
          const parsed: T = JSON.parse(result as string)
          this.cache[key] = parsed
          resolve(parsed)
        } catch (err) {
          this.cache[key] = result
          resolve(result as T)
        }
      })
    })
  }
}
