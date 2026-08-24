<template>
  <div class="space-y-6">
    <Header
      :title="$t('pages.dashboard.title')"
      :description="$t('pages.dashboard.description')"
    />

    <div class="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.totalAgents') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : totalAgents }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.eligibleAgents') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : eligibleAgents }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.callsToday') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : stats?.total ?? 0 }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.answerRate') }}</span>
          <span
            class="text-2xl font-semibold"
            :class="answerRateWarning ? 'text-warning' : 'text-highlighted'"
          >
            {{ isLoading || stats?.answerRate == null ? '—' : `${Math.round(stats.answerRate * 100)}%` }}
          </span>
          <span
            v-if="answerRateWarning"
            class="text-xs text-warning"
          >{{ $t('pages.dashboard.answerRateWarning') }}</span>
        </div>
      </UCard>
      <UCard>
        <div class="flex flex-col gap-1">
          <span class="text-sm text-muted">{{ $t('pages.dashboard.missedToday') }}</span>
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : stats?.missed ?? 0 }}</span>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { agentService } from '~/services/agent-service'
import { callService } from '~/services/call-service'
import type { CallStats } from '~/types/call'

definePageMeta({
  layout: 'dashboard'
})

const isLoading = ref(true)
const totalAgents = ref(0)
const eligibleAgents = ref(0)
const stats = ref<CallStats | null>(null)

const answerRateWarning = computed(() => stats.value?.answerRate != null && stats.value.answerRate < 0.85)

onMounted(async () => {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [agentsResponse, statsResponse] = await Promise.all([
      // limit=100: this dashboard card only needs a headline count; a
      // dedicated stats endpoint can replace this once the roster grows
      // past a page. See docs/API-SPEC.md — /api/agent has no count-only mode yet.
      agentService.getAll(1, 100),
      callService.getStats({ from: startOfDay.toISOString() })
    ])
    if (agentsResponse.success) {
      totalAgents.value = agentsResponse.meta?.total ?? agentsResponse.data.length
      eligibleAgents.value = agentsResponse.data.filter(a => a.canReceiveCalls).length
    }
    if (statsResponse.success) {
      stats.value = statsResponse.data
    }
  } finally {
    isLoading.value = false
  }
})
</script>
