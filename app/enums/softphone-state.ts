export const SOFTPHONE_STATES = ['disconnected', 'idle', 'connecting', 'active', 'ending'] as const

export type SoftphoneState = typeof SOFTPHONE_STATES[number]
