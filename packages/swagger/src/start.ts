import { app } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'
// import { registerInConsul } from '@gtms/lib-consul'

const port = parseInt(config.get<string>('port'), 10) || 3000
const serviceName = config.get<string>('serviceName')

app.listen(port, () => {
  logger.info(`${serviceName.toUpperCase()} started on port ${port}`)
  // registerInConsul(serviceName, port)
})
