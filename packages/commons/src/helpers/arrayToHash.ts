export function arrayToHash(records: any[], field: string) {
  return records.reduce((result, record) => {
    result[record[field]] = record

    return result
  }, {})
}
