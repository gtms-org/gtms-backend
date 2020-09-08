export function getS3InfoFromUrl(
  url: string
): {
  bucket: string
  file: string
} {
  url = url.replace('https://', '').replace('http://', '')
  const bucketSplit = url.split('.')
  const fileSplit = url.split('/')

  return {
    bucket: bucketSplit[0],
    file: fileSplit[1],
  }
}
