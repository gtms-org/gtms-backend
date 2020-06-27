import { server } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'
import { registerInConsul } from '@gtms/lib-consul'

const port = parseInt(config.get<string>('port'), 10) || 3000
const serviceName = config.get<string>('serviceName')

server.listen(port)
logger.info(`${serviceName.toUpperCase()} worker started on port ${port}`)
registerInConsul(serviceName, port)
