<template>
  <div class="space-y-6">
    <AppHeader
      :title="$t('pages.dashboard.title')"
      :description="$t('pages.dashboard.description')"
    />

    <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.totalUsers') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : totalUsers }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.onlineUsers') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : onlineUsers.length }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.inboundToday') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : stats?.inbound ?? 0 }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.outboundToday') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : stats?.outbound ?? 0 }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.missedToday') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : stats?.missed ?? 0 }}</span>
        </div>
      </UCard>
    </div>

    <div class="space-y-3">
      <h2 class="text-base font-semibold text-highlighted">
        {{ $t('pages.dashboard.onlineAgents') }}
      </h2>
      <div class="overflow-x-auto">
        <UTable
          :data="onlineUsers"
          :columns="columns"
          :loading="isLoading"
          :ui="{
            th: 'bg-muted py-2.5',
            td: 'text-highlighted py-3'
          }"
          class="border border-default rounded-md min-w-[640px]"
        >
          <template #empty>
            <span class="text-sm text-muted">{{ $t('pages.dashboard.noOnlineAgents') }}</span>
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { userService } from '~/services/user-service'
import { callService } from '~/services/call-service'
import type { CallStats } from '~/types/call'
import type { User } from '~/types/user'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const UAvatar = resolveComponent('UAvatar')

const isLoading = ref(true)
const totalUsers = ref(0)
const onlineUsers = ref<User[]>([])
const stats = ref<CallStats | null>(null)

const columns: TableColumn<User>[] = [
  {
    accessorKey: 'name',
    header: () => t('pages.user.columnUser'),
    cell: ({ row }) => h('div', { class: 'flex items-center gap-2.5' }, [
      h(UAvatar, { src: row.original.photo ?? undefined, alt: row.original.name }),
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-highlighted' }, row.original.name),
        h('span', { class: 'text-xs text-muted' }, row.original.email)
      ])
    ])
  },
  {
    accessorKey: 'branch',
    header: () => t('pages.user.columnBranch'),
    cell: ({ row }) => row.original.branch?.name || '—'
  },
  {
    accessorKey: 'availability',
    header: () => t('pages.user.columnStatus'),
    cell: ({ row }) => row.original.currentCallId != null
      ? statusDot(false, t('pages.dashboard.onCall'), 'warning')
      : statusDot(true, t(`pages.user.status.${row.original.availability}`))
  }
]

onMounted(async () => {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [usersResponse, onlineResponse, statsResponse] = await Promise.all([
      userService.getAll({ page: 1, limit: 1 }),
      userService.getOnline(),
      callService.getStats({ from: startOfDay.toISOString() })
    ])
    if (usersResponse.success) {
      totalUsers.value = usersResponse.meta?.total ?? usersResponse.data.length
    }
    if (onlineResponse.success) {
      onlineUsers.value = onlineResponse.data
    }
    if (statsResponse.success) {
      stats.value = statsResponse.data
    }
  } finally {
    isLoading.value = false
  }
})
</script>
