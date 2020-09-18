import { ISerializedAbuseReport } from '@gtms/commons'
import { IAbuseReport } from '../models/abuseReports'

export function serializeAbuseReport(
  report: IAbuseReport
): ISerializedAbuseReport {
  return {
    group: report.group,
    post: report.post,
    comment: report.comment,
    text: report.text,
    html: report.html,
    owner: report.owner as string,
    reporter: report.reporter as string,
    moderator: report.moderator as string,
    reason: report.reason,
    substantiation: report.substantiation,
    status: report.status,
    confirmationDecision: report.confirmationDecision,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  }
}
