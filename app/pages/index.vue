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
          <span class="text-2xl font-semibold text-highlighted">{{ isLoading ? '—' : onlineUsers }}</span>
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
import { userService } from '~/services/user-service'
import { callService } from '~/services/call-service'
import type { CallStats } from '~/types/call'

definePageMeta({
  layout: 'dashboard'
})

const isLoading = ref(true)
const totalUsers = ref(0)
const onlineUsers = ref(0)
const stats = ref<CallStats | null>(null)

const answerRateWarning = computed(() => stats.value?.answerRate != null && stats.value.answerRate < 0.85)

onMounted(async () => {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const [usersResponse, availableResponse, statsResponse] = await Promise.all([
      userService.getAll({ page: 1, limit: 1 }),
      userService.getAvailable(),
      callService.getStats({ from: startOfDay.toISOString() })
    ])
    if (usersResponse.success) {
      totalUsers.value = usersResponse.meta?.total ?? usersResponse.data.length
    }
    if (availableResponse.success) {
      onlineUsers.value = availableResponse.data.length
    }
    if (statsResponse.success) {
      stats.value = statsResponse.data
    }
  } finally {
    isLoading.value = false
  }
})
</script>
