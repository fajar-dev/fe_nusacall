import { callService } from '~/services/call-service'
import { phoneNumberService } from '~/services/phone-number-service'
import type { Call, CallStatus } from '~/types/call'

const QUEUE_STATUSES: CallStatus[] = ['ringing']
const ONGOING_STATUSES: CallStatus[] = ['connecting', 'active']
const HISTORY_STATUSES: CallStatus[] = ['completed', 'missed', 'rejected', 'failed', 'abandoned']
const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300

export type BoardTab = 'queue' | 'ongoing' | 'history'

function matchesQuery(call: Call, q: string): boolean {
  if (!q) return true
  const needle = q.toLowerCase()
  return [call.contact?.profileName, call.waId, call.displayPhoneNumber, call.wacid]
    .some(field => field?.toLowerCase().includes(needle))
}

function upsert(list: Call[], call: Call) {
  const idx = list.findIndex(c => c.id === call.id)
  if (idx === -1) list.unshift(call)
  else list[idx] = call
}

function remove(list: Call[], id: number): boolean {
  const idx = list.findIndex(c => c.id === id)
  if (idx === -1) return false
  list.splice(idx, 1)
  return true
}

/**
 * Shared, realtime call board (queue/ongoing/history) — each tab is a server-paginated,
 * server-searched slice (search is global: one query re-fetches all three tabs), kept
 * live via the `call_board` WS broadcast (every status transition, system-wide, see
 * backend CallStateService.attachBoardListener). Lives in useState so every component
 * reading it shares the same lists, and they survive page navigation.
 */
export function useCallBoard() {
  const queue = useState<Call[]>('call-board-queue', () => [])
  const ongoing = useState<Call[]>('call-board-ongoing', () => [])
  const history = useState<Call[]>('call-board-history', () => [])
  const phoneNumberColors = useState<Record<string, string>>('call-board-phone-colors', () => ({}))
  const initialized = useState<boolean>('call-board-initialized', () => false)
  const searchQuery = useState<string>('call-board-search', () => '')

  const queuePage = useState<number>('call-board-queue-page', () => 1)
  const ongoingPage = useState<number>('call-board-ongoing-page', () => 1)
  const historyPage = useState<number>('call-board-history-page', () => 1)

  const queueHasMore = useState<boolean>('call-board-queue-has-more', () => false)
  const ongoingHasMore = useState<boolean>('call-board-ongoing-has-more', () => false)
  const historyHasMore = useState<boolean>('call-board-history-has-more', () => false)

  const queueLoading = useState<boolean>('call-board-queue-loading', () => false)
  const ongoingLoading = useState<boolean>('call-board-ongoing-loading', () => false)
  const historyLoading = useState<boolean>('call-board-history-loading', () => false)

  const signaling = useSignaling()

  function stateFor(tab: BoardTab) {
    if (tab === 'queue') return { list: queue, page: queuePage, hasMore: queueHasMore, loading: queueLoading, status: QUEUE_STATUSES, order: 'ASC' as const }
    if (tab === 'ongoing') return { list: ongoing, page: ongoingPage, hasMore: ongoingHasMore, loading: ongoingLoading, status: ONGOING_STATUSES, order: 'ASC' as const }
    return { list: history, page: historyPage, hasMore: historyHasMore, loading: historyLoading, status: HISTORY_STATUSES, order: 'DESC' as const }
  }

  async function fetchTab(tab: BoardTab, page: number) {
    const s = stateFor(tab)
    const res = await callService.getAll({
      status: s.status,
      q: searchQuery.value || undefined,
      page,
      limit: PAGE_SIZE,
      sortBy: 'createdAt',
      order: s.order
    })
    if (!res.success) return
    if (page === 1) s.list.value = res.data
    else s.list.value.push(...res.data)
    s.page.value = page
    s.hasMore.value = !!res.meta && res.meta.currentPage < res.meta.lastPage
  }

  async function loadInitial() {
    queueLoading.value = true
    ongoingLoading.value = true
    historyLoading.value = true
    const [, , , phoneNumbersRes] = await Promise.all([
      fetchTab('queue', 1),
      fetchTab('ongoing', 1),
      fetchTab('history', 1),
      phoneNumberService.getAll(1, 100)
    ])
    queueLoading.value = false
    ongoingLoading.value = false
    historyLoading.value = false
    if (phoneNumbersRes.success) {
      phoneNumberColors.value = Object.fromEntries(phoneNumbersRes.data.map(pn => [pn.phoneNumberId, pn.color]))
    }
  }

  async function loadMore(tab: BoardTab) {
    const s = stateFor(tab)
    if (s.loading.value || !s.hasMore.value) return
    s.loading.value = true
    try {
      await fetchTab(tab, s.page.value + 1)
    } finally {
      s.loading.value = false
    }
  }

  function applyUpdate(call: Call) {
    remove(queue.value, call.id)
    remove(ongoing.value, call.id)
    remove(history.value, call.id)

    if (!matchesQuery(call, searchQuery.value)) return

    if (QUEUE_STATUSES.includes(call.status)) {
      upsert(queue.value, call)
    } else if (ONGOING_STATUSES.includes(call.status)) {
      upsert(ongoing.value, call)
    } else {
      history.value.unshift(call)
    }
  }

  function init() {
    if (initialized.value || typeof window === 'undefined') return
    initialized.value = true

    loadInitial()
    signaling.on('call_board', (packet) => {
      if (!packet.data) return
      applyUpdate(packet.data as unknown as Call)
    })

    let debounceTimer: ReturnType<typeof setTimeout> | undefined
    watch(searchQuery, () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(loadInitial, SEARCH_DEBOUNCE_MS)
    })
  }

  return {
    queue,
    ongoing,
    history,
    queueHasMore,
    ongoingHasMore,
    historyHasMore,
    queueLoading,
    ongoingLoading,
    historyLoading,
    phoneNumberColors,
    searchQuery,
    init,
    loadMore
  }
}
