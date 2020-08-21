import { IOEmbed } from '../types.d'
import { replaceEmbedsWithHtml } from './oEmbed'
import { findAndLoadEmbeds } from '@gtms/lib-api'
import stripHtml from 'string-strip-html'

export function nl2br(text: string) {
  return text.replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2')
}

export async function prepareHtml(
  text: string,
  oEmbeds?: IOEmbed[] | boolean
): Promise<string> {
  console.log(stripHtml(text))
  let html = nl2br((stripHtml(text) as any).result) // types are wrong :(

  if (oEmbeds === true) {
    html = await findAndLoadEmbeds(html)
  }

  if (Array.isArray(oEmbeds)) {
    html = replaceEmbedsWithHtml(html, oEmbeds)
  }

  return html
}
