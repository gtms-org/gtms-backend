export function checkCommonResponseHeaders(header: { [key: string]: string }) {
  expect(header).toHaveProperty('x-traceid')
  expect(header).toHaveProperty('x-app')
  expect(header).toHaveProperty('x-app-version')
  expect(header).not.toHaveProperty('x-powered-by')
}
