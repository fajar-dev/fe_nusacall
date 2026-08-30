import type { CallHoursDay } from '~/types/account'

type DayOfWeek = CallHoursDay['day_of_week']

export const DEFAULT_OPEN_TIME = '0800'
export const DEFAULT_CLOSE_TIME = '1700'

export function findDayRange(hours: CallHoursDay[], day: DayOfWeek): CallHoursDay {
  return hours.find(range => range.day_of_week === day)
    ?? { day_of_week: day, open_time: DEFAULT_OPEN_TIME, close_time: DEFAULT_CLOSE_TIME }
}

export function isDayOpen(hours: CallHoursDay[], day: DayOfWeek): boolean {
  return hours.some(range => range.day_of_week === day)
}

export function withDayRange(hours: CallHoursDay[], day: DayOfWeek, openTime: string, closeTime: string): CallHoursDay[] {
  return hours.map(range =>
    range.day_of_week === day ? { ...range, open_time: openTime, close_time: closeTime } : range
  )
}

export function withDayToggled(hours: CallHoursDay[], day: DayOfWeek, open: boolean): CallHoursDay[] {
  const remaining = hours.filter(range => range.day_of_week !== day)
  if (open) remaining.push({ day_of_week: day, open_time: DEFAULT_OPEN_TIME, close_time: DEFAULT_CLOSE_TIME })
  return remaining
}
