export function getUniqueValues(records: any[], field: string) {
  const result: any[] = []

  for (const record of records) {
    if (!result.includes(record[field])) {
      result.push(record[field])
    }
  }

  return result
}
