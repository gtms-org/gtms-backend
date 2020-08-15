import { IOEmbed } from '../types.d'
import { replaceEmbedsWithHtml } from './oEmbed'

export function nl2br(text: string) {
  return text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2')
}

export function prepareHtml(text: string, oEmbeds?: IOEmbed[]): string {
  let html = nl2br(text)

  if (Array.isArray(oEmbeds)) {
    html = replaceEmbedsWithHtml(html, oEmbeds)
  }

  return html
}
