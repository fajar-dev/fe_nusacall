<template>
  <div class="space-y-6">
    <Header
      :title="$t('pages.agent.title')"
      :description="$t('pages.agent.description')"
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
      :search-placeholder="$t('pages.agent.searchPlaceholder')"
      table-class="min-w-[768px]"
    />
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { agentService } from '~/services/agent-service'
import type { Agent, AgentAvailability } from '~/types/agent'

definePageMeta({
  layout: 'dashboard'
})

const UBadge = resolveComponent('UBadge')
const USwitch = resolveComponent('USwitch')
const { t } = useI18n()
const toast = useToast()

const data = ref<Agent[]>([])
const isLoading = ref(false)

const meta = reactive({ total: 0, from: 0, to: 0 })

async function fetchAgents() {
  isLoading.value = true
  try {
    const response = await agentService.getAll(page.value, perPage.value, search.value)
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

const { search, perPage, page, sortHeader } = useTableQuery(fetchAgents)

const availabilityColor: Record<AgentAvailability, 'success' | 'warning' | 'neutral'> = {
  available: 'success',
  busy: 'warning',
  away: 'neutral',
  offline: 'neutral'
}

async function toggleCanReceiveCalls(agent: Agent, value: boolean) {
  try {
    await agentService.updateCanReceiveCalls(agent.username, value)
    agent.canReceiveCalls = value
    toast.add({
      title: t('pages.agent.updatedSuccess'),
      color: 'success',
      icon: 'i-lucide-circle-check'
    })
  } catch {
    // handleServiceError already showed a toast; nothing more to do.
  }
}

const columns: TableColumn<Agent>[] = [
  {
    accessorKey: 'displayName',
    header: sortHeader(() => t('pages.agent.columnAgent'), 'displayName'),
    cell: ({ row }) => {
      const name = row.original.displayName || row.original.username
      return h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-highlighted' }, name),
        h('span', { class: 'text-xs text-muted' }, row.original.username)
      ])
    }
  },
  {
    accessorKey: 'role',
    header: t('pages.agent.columnRole'),
    cell: ({ row }) => row.original.role || '-'
  },
  {
    accessorKey: 'availability',
    header: t('pages.agent.columnAvailability'),
    cell: ({ row }) => {
      const availability = row.original.availability
      return h(
        UBadge,
        { color: availabilityColor[availability], variant: 'subtle' },
        () => t(`pages.agent.availability.${availability}`)
      )
    }
  },
  {
    accessorKey: 'totalCallsHandled',
    header: sortHeader(() => t('pages.agent.columnCallsHandled'), 'totalCallsHandled')
  },
  {
    accessorKey: 'canReceiveCalls',
    header: t('pages.agent.columnCanReceiveCalls'),
    cell: ({ row }) => {
      const agent = row.original
      return h(USwitch, {
        'modelValue': agent.canReceiveCalls,
        'onUpdate:modelValue': (value: boolean) => toggleCanReceiveCalls(agent, value)
      })
    }
  }
]
</script>
