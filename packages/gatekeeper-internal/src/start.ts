import { app } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'

const port = parseInt(config.get<string>('port'), 10) || 3000

app.listen(port, () => {
  logger.info(`Internal Gatekeeper started on port ${port}`)
})
