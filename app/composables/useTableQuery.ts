import { h } from 'vue'

export type SortOrder = 'ASC' | 'DESC'

interface TableQueryOptions {
  defaultSortBy?: string
  defaultOrder?: SortOrder
}

/**
 * Shared state for DataTable: search (debounced), pagination, and clickable/sortable
 * column headers. Call `onQueryChange` whenever any of these change to refetch data.
 */
export function useTableQuery(onQueryChange: () => void, options: TableQueryOptions = {}) {
  const { defaultSortBy = '', defaultOrder = 'DESC' } = options

  const search = ref('')
  const limitOptions = ref([10, 25, 50, 100])
  const perPage = ref(10)
  const page = ref(1)
  const sortBy = ref(defaultSortBy)
  const order = ref<SortOrder>(defaultOrder)

  const toggleSort = (column: string) => {
    if (sortBy.value === column) {
      order.value = order.value === 'ASC' ? 'DESC' : 'ASC'
    } else {
      sortBy.value = column
      order.value = 'ASC'
    }
  }

  watch([page, perPage, sortBy, order], onQueryChange)

  // Fires the first fetch via onMounted, not `watch(..., { immediate: true })` —
  // immediate would run before the caller finishes destructuring this
  // composable's return value, so onQueryChange would close over undefined bindings.
  onMounted(() => onQueryChange())

  let searchTimeout: ReturnType<typeof setTimeout>
  watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
      page.value = 1
      onQueryChange()
    }, 300)
  })

  /** Inline SVG, not `UIcon` — `resolveComponent` only works inside `.vue` `<script setup>`;
   * from this plain composable it silently falls back to a literal `<uicon>` tag. */
  const chevron = (direction: 'up' | 'down', colorClass: string) =>
    h('svg', {
      'viewBox': '0 0 24 24',
      'class': `w-3 h-3 ${colorClass}`,
      'fill': 'none',
      'stroke': 'currentColor',
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, [
      h('path', { d: direction === 'up' ? 'm18 15-6-6-6 6' : 'm6 9 6 6 6-6' })
    ])

  /** Clickable, sortable UTable column header. `label` is a fn so it re-evaluates per locale. */
  const sortHeader = (label: () => string, column: string, align: 'start' | 'center' | 'end' = 'start') => {
    return () => {
      const isActive = sortBy.value === column
      const upColor = isActive && order.value === 'ASC' ? 'text-primary' : 'text-neutral-300'
      const downColor = isActive && order.value === 'DESC' ? 'text-primary' : 'text-neutral-300'
      const justifyClass = align === 'center' ? 'justify-center' : align === 'end' ? 'justify-end' : ''
      return h('div', {
        class: `flex items-center gap-1 cursor-pointer select-none hover:text-primary transition-colors ${justifyClass}`.trim(),
        onClick: () => toggleSort(column)
      }, [
        h('span', label()),
        h('div', { class: 'flex flex-col -space-y-1.5' }, [
          chevron('up', upColor),
          chevron('down', downColor)
        ])
      ])
    }
  }

  return {
    search,
    limitOptions,
    perPage,
    page,
    sortBy,
    order,
    toggleSort,
    sortHeader
  }
}
