import { Time } from '@internationalized/date'
import type { TimeValue } from 'reka-ui'

export function parseHHmm(value: string): Time {
  if (!value || value.length < 4) return new Time(8, 0)
  const hours = parseInt(value.slice(0, 2), 10)
  const minutes = parseInt(value.slice(2, 4), 10)
  return new Time(isNaN(hours) ? 8 : hours, isNaN(minutes) ? 0 : minutes)
}

export function toHHmm(time?: TimeValue | null): string {
  if (!time) return '0800'
  const hours = String(time.hour).padStart(2, '0')
  const minutes = String(time.minute).padStart(2, '0')
  return `${hours}${minutes}`
}
