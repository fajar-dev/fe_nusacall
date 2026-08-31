<template>
  <div>
    <DataTable
      v-model:search="search"
      v-model:page="page"
      v-model:per-page="perPage"
      :columns="columns"
      :data="calls"
      :loading="loading"
      :total="meta.total"
      :from="meta.from"
      :to="meta.to"
      :search-placeholder="$t('pages.contactDetail.searchPlaceholder')"
      table-class="min-w-[760px]"
    />

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
import type { Call } from '~/types/call'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const route = useRoute()

const UAvatar = resolveComponent('UAvatar')
const UIcon = resolveComponent('UIcon')
const UButton = resolveComponent('UButton')

const contactId = Number(route.params.id)

const calls = ref<Call[]>([])
const loading = ref(false)
const meta = reactive({ total: 0, from: 0, to: 0 })
const detailOpen = ref(false)
const selectedCall = ref<Call | null>(null)

function openDetail(call: Call) {
  selectedCall.value = call
  detailOpen.value = true
}

async function fetchCalls() {
  loading.value = true
  try {
    const response = await callService.getAll({
      page: page.value,
      limit: perPage.value,
      q: search.value,
      contactId,
      sortBy: sortBy.value || undefined,
      order: order.value
    })
    if (response.success) {
      calls.value = response.data
      if (response.meta) {
        meta.total = response.meta.total
        meta.from = response.meta.from
        meta.to = response.meta.to
      }
    }
  } finally {
    loading.value = false
  }
}

const { search, perPage, page, sortBy, order, sortHeader } = useTableQuery(fetchCalls)

const columns: TableColumn<Call>[] = [
  {
    accessorKey: 'createdAt',
    header: sortHeader(() => t('pages.call.columnTime'), 'createdAt'),
    cell: ({ row }) => formatRelative(row.original.createdAt)
  },
  {
    accessorKey: 'direction',
    header: sortHeader(() => t('pages.call.columnDirection'), 'direction'),
    cell: ({ row }) =>
      h(UIcon, {
        name: callIcon(row.original),
        class: `size-4 ${callIconColor(row.original)}`,
        title: t(`pages.call.status.${row.original.status}`)
      })
  },
  {
    accessorKey: 'account',
    header: sortHeader(() => t('pages.call.columnAccount'), 'account'),
    cell: ({ row }) => {
      const account = row.original.account
      if (!account) return '—'
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-highlighted' }, account.label),
        h('span', { class: 'text-xs text-muted' }, account.displayPhoneNumber)
      ])
    }
  },
  {
    accessorKey: 'user',
    header: sortHeader(() => t('pages.call.columnAgent'), 'user'),
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
    header: sortHeader(() => t('pages.call.columnDuration'), 'durationSeconds'),
    cell: ({ row }) => {
      const seconds = row.original.durationSeconds
      return seconds == null ? '—' : formatDuration(seconds)
    }
  },
  {
    id: 'actions',
    header: t('pages.call.columnActions'),
    cell: ({ row }) =>
      h(UButton, {
        color: 'neutral',
        variant: 'outline',
        icon: 'i-lucide-eye',
        size: 'sm',
        onClick: () => openDetail(row.original)
      })
  }
]
</script>
