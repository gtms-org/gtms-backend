import remark from 'remark'
import oembed from '@agentofuser/remark-oembed'

export function parseMarkdown(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    remark()
      .use(oembed)
      .process(text, (err, file) => {
        if (err) {
          return reject(err)
        }

        resolve(`${file}`)
      })
  })
}
