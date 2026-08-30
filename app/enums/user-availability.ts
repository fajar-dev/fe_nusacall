export const USER_AVAILABILITIES = ['available', 'offline'] as const

export type UserAvailability = typeof USER_AVAILABILITIES[number]
