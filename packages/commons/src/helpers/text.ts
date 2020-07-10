export function replaceLast(find: string, replace: string, string: string) {
  const lastIndex = string.lastIndexOf(find)

  if (lastIndex === -1) {
    return string
  }

  const beginString = string.substring(0, lastIndex)
  const endString = string.substring(lastIndex + find.length)

  return beginString + replace + endString
}

export function parseText(text: string) {
  if (text === '') {
    return {
      text: '',
      lastTags: [],
    } as const
  }

  const words = text.match(/#?\b(\w+)\b/g)

  const tags = []

  for (let x = words.length - 1; x > -1; x--) {
    if (words[x].charAt(0) === '#') {
      tags.push(words[x])
    } else {
      break
    }
  }

  for (const tag of tags) {
    text = replaceLast(tag, '', text)
  }

  return {
    text: text.trim(),
    lastTags: tags.map(tag => tag.substr(1)),
  } as const
}
