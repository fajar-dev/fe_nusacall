<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.call.detail.title')"
    :ui="{ content: 'sm:max-w-xl', footer: 'justify-end' }"
  >
    <template #body>
      <div
        v-if="call"
        class="space-y-5"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-phone-call"
                class="size-4 text-muted"
              />
              <span class="text-xs text-muted tabular-nums">#{{ call.id }}</span>
            </div>
            <UBadge
              :color="statusColor"
              variant="subtle"
            >
              {{ $t(`pages.call.status.${call.status}`) }}
            </UBadge>
          </div>

          <div class="grid grid-cols-2 gap-3 p-3.5 rounded-lg border border-default bg-muted/20 text-sm">
            <div>
              <p class="text-xs text-muted mb-0.5">
                {{ $t('pages.call.detail.contact') }}
              </p>
              <p class="font-medium text-highlighted">
                {{ call.contact?.name || formatPhoneNumber(call.contact?.phoneNumber) }}
              </p>
              <p class="text-xs text-dimmed">
                {{ formatPhoneNumber(call.contact?.phoneNumber) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted mb-0.5">
                {{ $t('pages.call.columnAccount') }}
              </p>
              <p class="font-medium text-highlighted">
                {{ call.account?.label || '—' }}
              </p>
              <p
                v-if="call.account"
                class="text-xs text-muted"
              >
                {{ formatPhoneNumber(call.account.displayPhoneNumber) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted mb-0.5">
                {{ $t('pages.call.detail.agent') }}
              </p>
              <p class="font-medium text-highlighted">
                {{ call.user?.name || '—' }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted mb-0.5">
                {{ $t('pages.call.detail.duration') }}
              </p>
              <p class="font-medium text-highlighted">
                {{ call.durationSeconds != null ? formatDuration(call.durationSeconds) : '—' }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2.5">
            {{ $t('pages.call.detail.timeline') }}
          </h4>
          <div class="space-y-2 pl-1">
            <div
              v-for="event in timeline"
              :key="event.label"
              class="flex items-center justify-between text-sm"
            >
              <div class="flex items-center gap-2">
                <span class="size-1.5 rounded-full bg-primary shrink-0" />
                <span class="text-toned text-xs">{{ event.label }}</span>
              </div>
              <span class="text-xs text-highlighted">{{ event.time }}</span>
            </div>
          </div>
        </div>

        <template v-if="call.errorMessage">
          <UAlert
            color="error"
            variant="subtle"
            icon="i-lucide-alert-triangle"
            :title="$t('pages.call.detail.error')"
            :description="call.errorMessage"
          />
        </template>

        <template v-if="call.recordingEnabled">
          <USeparator />
          <div>
            <h4 class="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              {{ $t('pages.call.detail.recording') }}
            </h4>
            <div>
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
          </div>
        </template>

        <USeparator />
        <div class="flex items-center justify-between text-xs text-dimmed">
          <span v-if="call.errorCode">{{ $t('pages.call.detail.errorCode') }}: {{ call.errorCode }}</span>
          <span v-if="call.setupDurationMs != null">{{ $t('pages.call.detail.setupDuration') }}: {{ call.setupDurationMs }}ms</span>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        @click="() => { open = false }"
      >
        {{ $t('pages.call.detail.close') }}
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { callService } from '~/services/call-service'
import { formatClockTime, formatDuration, formatPhoneNumber } from '~/utils/format'
import type { Call, CallStatus, RecordingAvailability } from '~/types/call'

const props = defineProps<{ call: Call | null }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()

const loadingRecording = ref(false)
const recordingAvailability = ref<RecordingAvailability>({ state: 'not_ready' })

const statusColorMap: Record<CallStatus, 'success' | 'primary' | 'info' | 'warning' | 'neutral' | 'error'> = {
  completed: 'success',
  active: 'primary',
  ringing: 'info',
  connecting: 'info',
  pending: 'neutral',
  missed: 'warning',
  rejected: 'neutral',
  failed: 'error',
  abandoned: 'error'
}
const statusColor = computed(() => props.call ? statusColorMap[props.call.status] : 'neutral')

const timeline = computed(() => {
  if (!props.call) return []
  return [
    { label: t('pages.call.detail.created'), time: formatClockTime(props.call.createdAt) },
    { label: t('pages.call.detail.ringing'), time: formatClockTime(props.call.ringingAt) },
    { label: t('pages.call.detail.answered'), time: formatClockTime(props.call.answeredAt) },
    { label: t('pages.call.detail.ended'), time: formatClockTime(props.call.endedAt) }
  ].filter(e => e.time !== '—')
})

async function loadRecording() {
  if (!props.call?.recordingEnabled) return
  loadingRecording.value = true
  try {
    recordingAvailability.value = await callService.getRecordingAvailability(props.call.id)
  } catch {
    recordingAvailability.value = { state: 'not_ready' }
  } finally {
    loadingRecording.value = false
  }
}

function loadDetailData() {
  if (!open.value || !props.call) return
  if (props.call.recordingEnabled) {
    loadRecording()
  }
}

watch([open, () => props.call], () => {
  loadDetailData()
}, { immediate: true })
</script>
