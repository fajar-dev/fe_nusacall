import type { Call } from '~/types/call'

const FAILED_STATUSES = ['missed', 'rejected', 'failed', 'abandoned']

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

export function callIconColor(call: Call): string {
  return FAILED_STATUSES.includes(call.status) ? 'text-red-500' : 'text-green-500'
}

export function matchesCallQuery(call: Call, query: string): boolean {
  if (!query) return true
  const needle = query.toLowerCase()
  return [call.contact?.profileName, call.waId, call.displayPhoneNumber, call.wacid]
    .some(field => field?.toLowerCase().includes(needle))
}
