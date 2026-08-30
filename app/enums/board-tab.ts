export const BOARD_TABS = ['queue', 'ongoing', 'history'] as const

export type BoardTab = typeof BOARD_TABS[number]
