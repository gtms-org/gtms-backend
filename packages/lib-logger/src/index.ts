import winston from 'winston'
import config from 'config'

const { NODE_ENV } = process.env

export const logger = winston.createLogger({
  format: winston.format.json(),
  defaultMeta: { service: config.get<string>('serviceName') },
  level: 'debug',
  transports: [new winston.transports.Console()],
})

export const stream = {
  write: (message: string) => {
    if (NODE_ENV === 'test') {
      return
    }
    logger.info(message)
  },
}

export default logger
