function appendValue(query: URLSearchParams, key: string, value: unknown): void {
  if (value === undefined || value === null || value === '') return

  if (Array.isArray(value)) {
    if (value.length) query.set(key, value.join(','))
    return
  }

  query.set(key, String(value))
}

export function buildQuery<T extends object>(params: T): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    appendValue(query, key, value)
  }
  return query.toString()
}

export function buildPagedQuery<T extends { page?: number, limit?: number }>(params: T): string {
  const { page, limit, ...rest } = params
  return buildQuery({ page: page ?? 1, limit: limit ?? 10, ...rest })
}
