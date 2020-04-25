import { server } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'

const port = config.get<number>('port') || 3000

server.listen(port)
logger.info(`Groups worker started on port ${port}`)
