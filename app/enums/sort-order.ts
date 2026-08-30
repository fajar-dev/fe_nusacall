export const SORT_ORDERS = ['ASC', 'DESC'] as const

export type SortOrder = typeof SORT_ORDERS[number]
