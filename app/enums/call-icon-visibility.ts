export const CALL_ICON_VISIBILITIES = ['DEFAULT', 'DISABLE_ALL'] as const

export type CallIconVisibility = typeof CALL_ICON_VISIBILITIES[number]
