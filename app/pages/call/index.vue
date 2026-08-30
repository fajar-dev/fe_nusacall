<template>
  <div class="space-y-6">
    <AppHeader
      :title="$t('pages.call.title')"
      :description="$t('pages.call.description')"
    />

    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:per-page="perPage"
      :data="data"
      :columns="columns"
      :loading="isLoading"
      :total="meta.total"
      :from="meta.from"
      :to="meta.to"
      :search-placeholder="$t('pages.call.searchPlaceholder')"
      table-class="min-w-[900px]"
    >
      <template #filters>
        <div class="flex items-center gap-2">
          <USelectMenu
            v-model="statusFilter"
            :items="statusOptions"
            multiple
            value-key="value"
            :placeholder="$t('pages.call.filterStatus')"
            class="w-40"
          />
          <USelect
            v-model="directionFilter"
            :items="directionOptions"
            class="w-36"
          />
        </div>
      </template>
    </DataTable>

    <CallDetailModal
      v-model:open="detailOpen"
      :call="selectedCall"
    />
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { callService } from '~/services/call-service'
import { callIcon, callIconColor } from '~/composables/call-display'
import type { Call, CallStatus } from '~/types/call'

definePageMeta({
  layout: 'dashboard'
})

const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UIcon = resolveComponent('UIcon')
const { t } = useI18n()

const data = ref<Call[]>([])
const isLoading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })

const statusFilter = ref<CallStatus[]>([])
const directionFilter = ref<'all' | 'inbound' | 'outbound'>('all')

const detailOpen = ref(false)
const selectedCall = ref<Call | null>(null)

async function fetchCalls() {
  isLoading.value = true
  try {
    const response = await callService.getAll({
      page: page.value,
      limit: perPage.value,
      q: search.value || undefined,
      status: statusFilter.value.length ? statusFilter.value : undefined,
      direction: directionFilter.value === 'all' ? undefined : directionFilter.value,
      sortBy: sortBy.value || undefined,
      order: order.value
    })
    if (response.success) {
      data.value = response.data
      if (response.meta) {
        meta.total = response.meta.total
        meta.from = response.meta.from
        meta.to = response.meta.to
      }
    }
  } finally {
    isLoading.value = false
  }
}

const { search, perPage, page, sortBy, order, sortHeader } = useTableQuery(fetchCalls)

watch([statusFilter, directionFilter], () => {
  page.value = 1
  fetchCalls()
})

function openDetail(call: Call) {
  selectedCall.value = call
  detailOpen.value = true
}

const statusOptions = (['pending', 'ringing', 'connecting', 'active', 'completed', 'missed', 'rejected', 'failed', 'abandoned'] as CallStatus[])
  .map(value => ({ label: t(`pages.call.status.${value}`), value }))

const directionOptions = [
  { label: t('pages.call.directionAll'), value: 'all' },
  { label: t('pages.call.directionInbound'), value: 'inbound' },
  { label: t('pages.call.directionOutbound'), value: 'outbound' }
]

const relativeFormatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / 60000)
  if (Math.abs(diffMinutes) < 60) return relativeFormatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, 'hour')
  return relativeFormatter.format(Math.round(diffHours / 24), 'day')
}

const columns: TableColumn<Call>[] = [
  {
    accessorKey: 'createdAt',
    header: sortHeader(() => t('pages.call.columnTime'), 'createdAt'),
    cell: ({ row }) => formatRelative(row.original.createdAt)
  },
  {
    accessorKey: 'direction',
    header: t('pages.call.columnDirection'),
    cell: ({ row }) =>
      h(UIcon, {
        name: callIcon(row.original),
        class: `size-4 ${callIconColor(row.original)}`,
        title: t(`pages.call.status.${row.original.status}`)
      })
  },
  {
    accessorKey: 'contact',
    header: t('pages.call.columnContact'),
    cell: ({ row }) => {
      const name = row.original.contact?.profileName || row.original.waId
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-highlighted' }, name),
        h('span', { class: 'text-xs text-muted' }, row.original.waId)
      ])
    }
  },
  {
    accessorKey: 'displayPhoneNumber',
    header: t('pages.call.columnDestination'),
    cell: ({ row }) => row.original.displayPhoneNumber || row.original.phoneNumberId
  },
  {
    accessorKey: 'user',
    header: t('pages.call.columnAgent'),
    cell: ({ row }) => {
      const user = row.original.user
      if (!user) return '—'
      return h('div', { class: 'flex items-center gap-2.5' }, [
        h(UAvatar, { src: user.photo ?? undefined, alt: user.name }),
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-medium text-highlighted' }, user.name),
          h('span', { class: 'text-xs text-muted' }, user.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'durationSeconds',
    header: t('pages.call.columnDuration'),
    cell: ({ row }) => {
      const seconds = row.original.durationSeconds
      if (seconds == null) return '—'
      const minutes = Math.floor(seconds / 60)
      return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    }
  },
  {
    id: 'actions',
    header: t('pages.call.columnActions'),
    cell: ({ row }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-lucide-eye',
        size: 'sm',
        onClick: () => openDetail(row.original)
      })
  }
]
</script>
