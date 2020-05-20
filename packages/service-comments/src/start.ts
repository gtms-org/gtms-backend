import { app } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'

const port = config.get<number>('port') || 3000

app.listen(port, () => {
  logger.info(`Comments service started on port ${port}`)
})
