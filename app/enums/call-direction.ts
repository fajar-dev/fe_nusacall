export const CALL_DIRECTIONS = ['inbound', 'outbound'] as const

export type CallDirection = typeof CALL_DIRECTIONS[number]
