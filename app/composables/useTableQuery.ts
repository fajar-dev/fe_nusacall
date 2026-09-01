import { h } from 'vue'

import type { SortOrder } from '~/enums/sort-order'

export type { SortOrder }

interface TableQueryOptions {
  defaultSortBy?: string
  defaultOrder?: SortOrder
}

export function useTableQuery(onQueryChange: () => void, options: TableQueryOptions = {}) {
  const { defaultSortBy = '', defaultOrder = 'DESC' } = options

  const search = ref('')
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

  onMounted(() => onQueryChange())

  const resetToFirstPage = () => {
    if (page.value !== 1) {
      page.value = 1
      return
    }
    onQueryChange()
  }

  let searchTimeout: ReturnType<typeof setTimeout>
  watch(search, () => {
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(resetToFirstPage, 300)
  })

  onScopeDispose(() => clearTimeout(searchTimeout))

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
    perPage,
    page,
    sortBy,
    order,
    toggleSort,
    sortHeader,
    resetToFirstPage
  }
}
