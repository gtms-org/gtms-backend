import cron from 'node-cron'
import { cleanupTmpFiles } from './cron'

export function initCronJobs() {
  cron.schedule('*/25 * * * *', cleanupTmpFiles) // every 25th min
}
