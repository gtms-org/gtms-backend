import { Request, Response, NextFunction } from 'express'
import logger from '@gtms/lib-logger'
import { IAuthRequest } from '@gtms/commons'
import { PostModel, IPost, serializePost } from '@gtms/lib-models'
import { findUsersByIds } from '@gtms/lib-api'

export default {
  addToFavs(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    PostModel.updateOne(
      {
        _id: id,
      },
      {
        $addToSet: {
          favs: req.user.id,
        },
      }
    )
      .then(({ n }) => {
        if (n === 0) {
          return res.status(404).end()
        }

        res.status(201).end()
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  removeFromFavs(req: IAuthRequest, res: Response, next: NextFunction) {
    const { id } = req.params

    PostModel.updateOne(
      {
        _id: id,
      },
      {
        $pull: {
          favs: req.user.id,
        },
      }
    )
      .then(({ n }) => {
        if (n === 0) {
          return res.status(404).end()
        }

        res.status(201).end()
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  postFavs(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params

    PostModel.findById(id)
      .then(async (post: IPost | null) => {
        if (!post) {
          return res.status(404).end()
        }

        const favs = post.favs || []

        if (favs.length === 0) {
          return res
            .status(200)
            .json([])
            .end()
        }

        try {
          const users = await findUsersByIds(favs, {
            traceId: res.get('x-traceid'),
          })

          res
            .status(200)
            .json(users)
            .end()
        } catch (err) {
          res.status(500).end()

          logger.log({
            level: 'error',
            traceId: res.get('x-traceid'),
            message: `Can not fetch users details from API - ${err}`,
          })
        }
      })
      .catch(err => {
        next(err)

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
  myFavs(req: IAuthRequest, res: Response, next: NextFunction) {
    PostModel.find({
      favs: {
        $in: req.user.id,
      },
    })
      .then((posts: IPost[]) => {
        res.status(200).json(posts.map(post => serializePost(post)))
      })
      .then(err => {
        next(err)

        logger.log({
          message: `Database error ${err}`,
          level: 'error',
          traceId: res.get('x-traceid'),
        })
      })
  },
}
