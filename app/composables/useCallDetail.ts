import type { Call } from '~/types/call'

export function useCallDetail() {
  const call = useState<Call | null>('call-detail-call', () => null)
  const open = useState<boolean>('call-detail-open', () => false)

  function show(next: Call) {
    call.value = next
    open.value = true
  }

  function close() {
    open.value = false
    call.value = null
  }

  return { call, open, show, close }
}
