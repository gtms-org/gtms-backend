import config from 'config'
import { Client } from '@elastic/elasticsearch'

export const client: Client = new Client({
  node: `http://${config.get<string>('esHost')}:${config.get<number>(
    'esPort'
  )}`,
})
