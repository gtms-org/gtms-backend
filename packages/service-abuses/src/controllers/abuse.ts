import { Request, Response, NextFunction } from 'express'
import { getComment, getPost } from '@gtms/lib-api'
import {
  IAuthRequest,
  ISerializedComment,
  ISerializedPost,
  ISerializedGroup,
} from '@gtms/commons'
import { IAbuseReport, AbuseReportModel } from '@gtms/lib-models'
import logger from '@gtms/lib-logger'

function fetchAbuseRelatedRecord(
  payload: { post?: string; comment?: string },
  traceId: string
): Promise<{
  type: 'post' | 'comment'
  record: ISerializedComment | ISerializedPost
  group: ISerializedGroup
}> {
  return new Promise((resolve, reject) => {
    if (payload.post) {
      getPost(payload.post, { traceId, group: true })
        .then(post => {
          resolve({
            type: 'post',
            record: post,
            group: post.group,
          })
        })
        .catch(err => {
          logger.log({
            level: 'error',
            message: `Can not fetch info about post - ${err}`,
            traceId,
          })
          reject()
        })
    } else {
      getComment(payload.comment, { traceId })
        .then(comment => {
          getPost(comment.post, { traceId, group: true })
            .then(post => {
              resolve({
                type: 'comment',
                record: comment,
                group: post.group,
              })
            })
            .catch(err => {
              logger.log({
                level: 'error',
                message: `Can not fetch info about post - ${err}`,
                traceId,
              })
              reject()
            })
        })
        .catch(err => {
          logger.log({
            level: 'error',
            message: `Can not fetch info about comment - ${err}`,
            traceId,
          })
          reject()
        })
    }
  })
}

export default {
  async create(req: IAuthRequest, res: Response, next: NextFunction) {
    const { body } = req

    if (!body.post && !body.comment) {
      return res.status(400).json({
        post: {
          message: `Field post is required`,
          name: 'required',
          properties: {
            message: `Field post is required`,
            type: 'required',
            path: 'post',
          },
        },
        comment: {
          message: `Field comment is required`,
          name: 'required',
          properties: {
            message: `Field comment is required`,
            type: 'required',
            path: 'post',
          },
        },
      })
    }

    try {
      const { type, record, group } = await fetchAbuseRelatedRecord(
        body,
        res.get('x-traceid')
      )

      const data: {
        group: string
        owner: string
        reporter: string
        reason: string
        substantiation?: string
        text: string
        html: string
        comment?: string
        post?: string
      } = {
        group: group.id,
        owner: record.owner as string,
        reporter: req.user.id,
        reason: body.reason,
        substantiation: body.substantiation,
        text: record.text,
        html: record.html,
      }

      switch (type) {
        case 'comment':
          data.comment = record.id
          break

        case 'post':
          data.post = record.id
          break
      }

      AbuseReportModel.create(data)
        .then((report: IAbuseReport) => {
          res.status(201).end()

          // todo: publish a message - notification, info about abuse
        })
        .catch(err => {
          next(err)

          logger.log({
            level: 'error',
            message: `Database error: ${err}`,
            traceId: res.get('x-traceid'),
          })
        })
    } catch {
      logger.log({
        level: 'error',
        message: `Can not create a new abouse report - not possible to fetch related records data`,
        traceId: res.get('x-traceid'),
      })

      res.status(500).end()
    }
  },
}
