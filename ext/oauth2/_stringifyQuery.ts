export function stringifyQuery(
  params: Record<string, string | boolean | number>,
) {
  return Object.keys(params).map((key) =>
    key + '=' +
    encodeURIComponent(
      typeof params[key] === 'string'
        ? params[key]
        : JSON.stringify(params[key]),
    )
  ).join('&')
}
