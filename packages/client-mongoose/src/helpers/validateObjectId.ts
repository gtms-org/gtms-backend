const re = /^[a-fA-F0-9]{24}$/

export function validateObjectId(toCheck: any) {
  return typeof toCheck === 'string' && re.test(toCheck)
}
