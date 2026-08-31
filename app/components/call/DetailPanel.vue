<template>
  <aside
    v-if="open"
    class="h-full w-full sm:w-96 shrink-0 border-l border-default bg-default flex flex-col shadow-md"
  >
    <div class="px-4 pt-5 pb-3 flex items-center justify-between shrink-0">
      <h2 class="text-lg font-bold text-highlighted tracking-tight">
        {{ $t('pages.call.detail.title') }}
      </h2>
      <UButton
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="sm"
        :aria-label="$t('pages.call.detail.close')"
        @click="close"
      />
    </div>

    <div
      v-if="call"
      class="flex-1 overflow-y-auto px-4 pb-6 space-y-5"
    >
      <UBadge
        color="neutral"
        variant="subtle"
        class="tabular-nums"
      >
        #{{ call.id }}
      </UBadge>

      <dl class="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-default bg-muted/20 text-sm">
        <div class="min-w-0">
          <dt class="text-xs text-muted mb-0.5">
            {{ $t('pages.call.detail.contact') }}
          </dt>
          <dd class="font-medium text-highlighted truncate">
            {{ call.contact?.name || formatPhoneNumber(call.contact?.phoneNumber) }}
          </dd>
          <dd class="text-xs text-dimmed truncate">
            {{ formatPhoneNumber(call.contact?.phoneNumber) }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs text-muted mb-0.5">
            {{ $t('pages.call.columnAccount') }}
          </dt>
          <dd class="font-medium text-highlighted truncate">
            {{ call.account?.label || '—' }}
          </dd>
          <dd
            v-if="call.account"
            class="text-xs text-muted truncate"
          >
            {{ formatPhoneNumber(call.account.displayPhoneNumber) }}
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs text-muted mb-0.5">
            {{ $t('pages.call.detail.agent') }}
          </dt>
          <dd
            v-if="call.user"
            class="flex items-center gap-2 min-w-0"
          >
            <UAvatar
              :src="call.user.photo ?? undefined"
              :alt="call.user.name"
              size="xs"
            />
            <span class="min-w-0">
              <span class="block font-medium text-highlighted truncate">{{ call.user.name }}</span>
              <span class="block text-xs text-muted truncate">{{ call.user.email }}</span>
            </span>
          </dd>
          <dd
            v-else
            class="font-medium text-highlighted"
          >
            —
          </dd>
        </div>
        <div class="min-w-0">
          <dt class="text-xs text-muted mb-0.5">
            {{ $t('pages.call.detail.duration') }}
          </dt>
          <dd class="font-medium text-highlighted">
            {{ call.durationSeconds != null ? formatDuration(call.durationSeconds) : '—' }}
          </dd>
        </div>
      </dl>

      <div>
        <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
          {{ $t('pages.call.detail.timeline') }}
        </h3>
        <UTimeline
          :items="timeline"
          size="xs"
          color="primary"
          :default-value="timeline.length - 1"
        />
      </div>

      <UAlert
        v-if="call.errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="$t('pages.call.detail.error')"
        :description="call.errorMessage"
      />

      <template v-if="call.recordingEnabled">
        <USeparator />
        <div>
          <h3 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
            {{ $t('pages.call.detail.recording') }}
          </h3>
          <USkeleton
            v-if="loadingRecording"
            class="h-9 w-full rounded-md"
          />
          <div v-else-if="recordingAvailability.state === 'ready'">
            <audio
              :src="recordingAvailability.url"
              controls
              preload="none"
              class="w-full h-9 rounded-md"
            />
            <span class="text-xs text-dimmed mt-1 block">{{ $t('components.callRecording.stereoHint') }}</span>
          </div>
          <p
            v-else
            class="text-xs text-dimmed p-2 rounded-md bg-muted/20"
          >
            {{ $t('components.callRecording.notReady') }}
          </p>
        </div>
      </template>

      <USeparator />
      <div class="flex items-center justify-between text-xs text-dimmed">
        <span v-if="call.errorCode">{{ $t('pages.call.detail.errorCode') }}: {{ call.errorCode }}</span>
        <span v-if="call.setupDurationMs != null">{{ $t('pages.call.detail.setupDuration') }}: {{ call.setupDurationMs }}ms</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { callService } from '~/services/call-service'
import { formatClockTime, formatDuration, formatPhoneNumber } from '~/utils/format'
import type { RecordingAvailability } from '~/types/call'

const { call, open, close } = useCallDetail()
const { t } = useI18n()

const loadingRecording = ref(false)
const recordingAvailability = ref<RecordingAvailability>({ state: 'not_ready' })

const timeline = computed(() => {
  if (!call.value) return []
  return [
    { title: t('pages.call.detail.created'), date: formatClockTime(call.value.createdAt), icon: 'i-lucide-phone-incoming' },
    { title: t('pages.call.detail.ringing'), date: formatClockTime(call.value.ringingAt), icon: 'i-lucide-bell-ring' },
    { title: t('pages.call.detail.answered'), date: formatClockTime(call.value.answeredAt), icon: 'i-lucide-phone-call' },
    { title: t('pages.call.detail.ended'), date: formatClockTime(call.value.endedAt), icon: 'i-lucide-phone-off' }
  ].filter(event => event.date !== '—')
})

async function loadRecording() {
  const current = call.value
  if (!current?.recordingEnabled) {
    recordingAvailability.value = { state: 'not_ready' }
    return
  }
  loadingRecording.value = true
  try {
    recordingAvailability.value = await callService.getRecordingAvailability(current.id)
  } catch {
    recordingAvailability.value = { state: 'not_ready' }
  } finally {
    loadingRecording.value = false
  }
}

watch(call, () => {
  recordingAvailability.value = { state: 'not_ready' }
  loadRecording()
})
</script>
