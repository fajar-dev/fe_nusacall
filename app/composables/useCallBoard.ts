import { callService } from '~/services/call-service'
import { accountService } from '~/services/account-service'
import { matchesCallQuery } from '~/utils/call'
import { removeById, upsertById } from '~/utils/array'
import type { Call } from '~/types/call'
import type { CallStatus } from '~/enums/call-status'
import type { BoardTab } from '~/enums/board-tab'

const QUEUE_STATUSES: CallStatus[] = ['ringing']
const ONGOING_STATUSES: CallStatus[] = ['connecting', 'active']
const HISTORY_STATUSES: CallStatus[] = ['completed', 'missed', 'rejected', 'failed', 'abandoned']
const PAGE_SIZE = 30
const SEARCH_DEBOUNCE_MS = 300

export type { BoardTab }

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
    const [, , , accountsRes] = await Promise.all([
      fetchTab('queue', 1),
      fetchTab('ongoing', 1),
      fetchTab('history', 1),
      accountService.getAll(1, 100)
    ])
    queueLoading.value = false
    ongoingLoading.value = false
    historyLoading.value = false
    if (accountsRes.success) {
      phoneNumberColors.value = Object.fromEntries(accountsRes.data.map(pn => [pn.phoneNumberId, pn.color]))
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
    removeById(queue.value, call.id)
    removeById(ongoing.value, call.id)
    removeById(history.value, call.id)

    if (!matchesCallQuery(call, searchQuery.value)) return

    if (QUEUE_STATUSES.includes(call.status)) {
      upsertById(queue.value, call)
    } else if (ONGOING_STATUSES.includes(call.status)) {
      upsertById(ongoing.value, call)
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
