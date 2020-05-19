import { Response, Request, NextFunction } from 'express'
import { IAuthRequest } from '@gtms/commons'
import logger from '@gtms/lib-logger'
import { PostModel, IPost } from '@gtms/lib-models'

export default {
    create(req: IAuthRequest, res: Response, next: NextFunction) {
        const { body: { group, text, tags = []} } = req

        PostModel.create({
            group,
            text,
            tags,
            owner: req.user.id,
        }).then((post: IPost) => {
            
        })
    }
}
