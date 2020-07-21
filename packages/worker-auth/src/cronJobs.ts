import {
  clearOutdatedRefreshTokens,
  clearOutdatedActivationCodes,
} from './cron'
import cron from 'node-cron'

export function initCronJobs() {
  cron.schedule('37 */1 * * *', clearOutdatedRefreshTokens) // every 1
  cron.schedule('0 3 */3 * *', clearOutdatedActivationCodes) // every 3 days
}
