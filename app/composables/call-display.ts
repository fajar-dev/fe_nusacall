import type { Call } from '~/types/call'

const FAILED_STATUSES = ['missed', 'rejected', 'failed', 'abandoned']

/** Single icon encoding both outcome and direction — failed outcomes win over direction. */
export function callIcon(call: Call): string {
  if (call.status === 'missed') {
    return 'i-lucide-phone-missed'
  }
  if (call.status === 'rejected' || call.status === 'failed' || call.status === 'abandoned') {
    return 'i-lucide-x'
  }
  if (call.direction === 'outbound') {
    return 'i-lucide-phone-outgoing'
  }
  return 'i-lucide-phone-incoming'
}

/** Red for any call that never completed, green otherwise. */
export function callIconColor(call: Call): string {
  return FAILED_STATUSES.includes(call.status) ? 'text-red-500' : 'text-green-500'
}
