import { app } from './index'
import config from 'config'
import logger from '@gtms/lib-logger'
import { registerInConsul } from '@gtms/lib-consul'

const port = parseInt(config.get<string>('port'), 10) || 3000

// require('dns').lookup(require('os').hostname(), function (_: any, add: any) {
//   console.log('addr: '+add);
// })

app.listen(port, () => {
  logger.info(`Auth service started on port ${port}`)

  registerInConsul(config.get<string>('serviceName'), port)
})
