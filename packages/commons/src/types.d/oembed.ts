export interface IOEmbed {
  url: string
  result: {
    type: string // video, image, rich
    html: string
    provider_name: string
    provider_url: string
    thumbnail_url?: string
    thumbnail_width?: number
    thumbnail_height?: number
  }
}
