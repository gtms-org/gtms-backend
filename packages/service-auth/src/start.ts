import { app } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'
import { registerInConsul } from '@gtms/lib-consul'

const port = parseInt(config.get<string>('port'), 10) || 3000

app.listen(port, () => {
  logger.info(`Auth service started on port ${port}`)

  registerInConsul(config.get<string>('serviceName'), port)
})
