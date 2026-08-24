<template>
  <UModal
    v-model:open="open"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #content>
      <UCard
        v-if="call"
        :ui="{ body: 'flex flex-col gap-5' }"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-base font-medium text-highlighted">
            {{ $t('pages.call.detail.title') }}
          </h3>
          <UBadge
            :color="statusColor"
            variant="subtle"
          >
            {{ $t(`pages.call.status.${call.status}`) }}
          </UBadge>
        </div>

        <!-- Ringkasan -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-xs text-muted">
              {{ $t('pages.call.detail.contact') }}
            </p>
            <p class="text-highlighted">
              {{ call.contactName || call.profileName || call.waId }}
            </p>
            <p class="text-xs text-dimmed">
              {{ call.waId }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">
              {{ $t('pages.call.detail.destination') }}
            </p>
            <p class="text-highlighted">
              {{ call.displayPhoneNumber || call.phoneNumberId }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">
              {{ $t('pages.call.detail.agent') }}
            </p>
            <p class="text-highlighted">
              {{ call.agentUsername || '—' }}
            </p>
          </div>
          <div>
            <p class="text-xs text-muted">
              {{ $t('pages.call.detail.duration') }}
            </p>
            <p class="text-highlighted">
              {{ call.durationSeconds != null ? formatDuration(call.durationSeconds) : '—' }}
            </p>
          </div>
        </div>

        <template v-if="call.phoneNumberId && call.waId">
          <USeparator />
          <CallOutboundAction
            :phone-number-id="call.phoneNumberId"
            :wa-id="call.waId"
          />
        </template>

        <USeparator />

        <!-- Linimasa -->
        <div>
          <p class="text-xs text-muted mb-2">
            {{ $t('pages.call.detail.timeline') }}
          </p>
          <ul class="space-y-1.5 text-sm">
            <li
              v-for="event in timeline"
              :key="event.label"
              class="flex justify-between"
            >
              <span class="text-toned">{{ event.label }}</span>
              <span class="text-highlighted">{{ event.time }}</span>
            </li>
          </ul>
        </div>

        <template v-if="call.errorMessage">
          <USeparator />
          <UAlert
            color="error"
            variant="subtle"
            :title="$t('pages.call.detail.error')"
            :description="call.errorMessage"
          />
        </template>

        <template v-if="call.recordingEnabled">
          <USeparator />
          <div>
            <p class="text-xs text-muted mb-2">
              {{ $t('pages.call.detail.recording') }}
            </p>
            <CallRecordingPlayer :call-id="call.id" />
          </div>
        </template>

        <template v-if="call.transcriptionEnabled">
          <USeparator />
          <div>
            <p class="text-xs text-muted mb-2">
              {{ $t('pages.call.detail.transcript') }}
            </p>
            <CallTranscriptViewer :call-id="call.id" />
          </div>
        </template>

        <USeparator />

        <!-- Teknis -->
        <div class="space-y-1 text-xs text-dimmed">
          <p>WACID: {{ call.wacid }}</p>
          <p v-if="call.errorCode">
            {{ $t('pages.call.detail.errorCode') }}: {{ call.errorCode }}
          </p>
          <p v-if="call.setupDurationMs != null">
            {{ $t('pages.call.detail.setupDuration') }}: {{ call.setupDurationMs }}ms
          </p>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Call, CallStatus } from '~/types/call'

const { t } = useI18n()

const props = defineProps<{ call: Call | null }>()
const open = defineModel<boolean>('open', { default: false })

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

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return timeFormatter.format(new Date(iso))
}

const timeline = computed(() => {
  if (!props.call) return []
  return [
    { label: t('pages.call.detail.created'), time: formatTime(props.call.createdAt) },
    { label: t('pages.call.detail.ringing'), time: formatTime(props.call.ringingAt) },
    { label: t('pages.call.detail.answered'), time: formatTime(props.call.answeredAt) },
    { label: t('pages.call.detail.ended'), time: formatTime(props.call.endedAt) }
  ].filter(e => e.time !== '—')
})
</script>
