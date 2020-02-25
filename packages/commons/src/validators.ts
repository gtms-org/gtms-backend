export function validateEmailAddress(email: string): boolean {
  const re = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
  return re.test(email)
}

export function validatePassword(pass: string): boolean {
  const re = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/

  return re.test(pass)
}
