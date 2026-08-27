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

        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p class="text-xs text-muted">
              {{ $t('pages.call.detail.contact') }}
            </p>
            <p class="text-highlighted">
              {{ call.contact?.profileName || call.waId }}
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
              {{ call.user?.name || '—' }}
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
          <div class="flex items-center gap-2 flex-wrap">
            <p
              v-if="loadingPermission"
              class="text-xs text-dimmed"
            >
              {{ $t('components.callOutbound.checking') }}
            </p>

            <template v-else-if="hasPermission">
              <UButton
                icon="i-lucide-phone-outgoing"
                size="sm"
                color="primary"
                :loading="calling"
                :disabled="softphoneState !== 'idle'"
                @click="handleCallOutbound"
              >
                {{ $t('components.callOutbound.call') }}
              </UButton>
              <span
                v-if="quotaText"
                class="text-xs text-dimmed"
              >{{ quotaText }}</span>
            </template>

            <template v-else>
              <UBadge
                color="neutral"
                variant="subtle"
              >
                {{ $t('components.callOutbound.noPermission') }}
              </UBadge>
              <UButton
                icon="i-lucide-send"
                size="sm"
                variant="subtle"
                :loading="requesting"
                :disabled="justRequested"
                @click="requestPermission"
              >
                {{ justRequested ? $t('components.callOutbound.requested') : $t('components.callOutbound.requestPermission') }}
              </UButton>
            </template>
          </div>
        </template>

        <USeparator />

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
            <div>
              <p
                v-if="loadingRecording"
                class="text-xs text-dimmed"
              >
                {{ $t('components.callRecording.loading') }}
              </p>
              <audio
                v-else-if="recordingAvailability.state === 'ready'"
                :src="recordingAvailability.url"
                controls
                preload="none"
                class="w-full h-9"
              />
              <p
                v-else-if="recordingAvailability.state === 'expired'"
                class="text-xs text-dimmed flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-clock-alert"
                  class="size-3.5 shrink-0"
                />
                {{ $t('components.callRecording.expired') }}
              </p>
              <p
                v-else
                class="text-xs text-dimmed"
              >
                {{ $t('components.callRecording.notReady') }}
              </p>
            </div>
          </div>
        </template>

        <template v-if="call.transcriptionEnabled">
          <USeparator />
          <div>
            <p class="text-xs text-muted mb-2">
              {{ $t('pages.call.detail.transcript') }}
            </p>
            <div>
              <p
                v-if="loadingTranscript"
                class="text-xs text-dimmed"
              >
                {{ $t('components.callRecording.loading') }}
              </p>

              <p
                v-else-if="transcriptAvailability.state === 'expired'"
                class="text-xs text-dimmed flex items-center gap-1.5"
              >
                <UIcon
                  name="i-lucide-clock-alert"
                  class="size-3.5 shrink-0"
                />
                {{ $t('components.callRecording.expired') }}
              </p>

              <p
                v-else-if="transcriptAvailability.state === 'not_ready'"
                class="text-xs text-dimmed"
              >
                {{ $t('components.callRecording.notReady') }}
              </p>

              <ul
                v-else-if="transcriptSegments.length"
                class="space-y-2.5 max-h-64 overflow-y-auto pr-1"
              >
                <li
                  v-for="(segment, i) in transcriptSegments"
                  :key="i"
                  class="flex gap-2 text-sm"
                >
                  <span class="text-xs text-dimmed font-mono shrink-0 w-10 pt-0.5">{{ formatTranscriptTimestamp(segment.start) }}</span>
                  <div class="min-w-0">
                    <UBadge
                      :color="segment.speaker === 'Business' ? 'primary' : 'neutral'"
                      variant="subtle"
                      size="sm"
                      class="mb-0.5"
                    >
                      {{ segment.speaker === 'Business' ? $t('components.callRecording.speakerBusiness') : $t('components.callRecording.speakerCustomer') }}
                    </UBadge>
                    <p class="text-toned break-words">
                      {{ segment.text }}
                    </p>
                  </div>
                </li>
              </ul>

              <p
                v-else
                class="text-xs text-dimmed"
              >
                {{ transcriptAvailability.state === 'ready' ? transcriptAvailability.content.transcript.text : '' }}
              </p>
            </div>
          </div>
        </template>

        <USeparator />

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
import { callService } from '~/services/call-service'
import { permissionService } from '~/services/permission-service'
import type { ArtifactAvailability, Call, CallStatus, TranscriptAvailability, TranscriptSegment } from '~/types/call'
import type { PermissionCheckResult } from '~/types/permission'

const props = defineProps<{ call: Call | null }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()
const { state: softphoneState, callOutbound } = useSoftphone()

// Permission state
const loadingPermission = ref(false)
const calling = ref(false)
const requesting = ref(false)
const justRequested = ref(false)
const permission = ref<PermissionCheckResult | null>(null)

// Recording state
const loadingRecording = ref(false)
const recordingAvailability = ref<ArtifactAvailability>({ state: 'not_ready' })

// Transcript state
const loadingTranscript = ref(false)
const transcriptAvailability = ref<TranscriptAvailability>({ state: 'not_ready' })

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

const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return timeFormatter.format(new Date(iso))
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatTranscriptTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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

const hasPermission = computed(() => {
  if (!permission.value) return false
  if (permission.value.status === 'permanent') return true
  if (permission.value.status === 'temporary') {
    return !permission.value.expiresAt || new Date(permission.value.expiresAt) > new Date()
  }
  return false
})

const quotaText = computed(() => {
  const action = permission.value?.quota?.find(a => a.action_name === 'start_call')
  const limit = action?.limits?.[0]
  if (!limit) return null
  return t('components.callOutbound.quota', { used: limit.current_usage, max: limit.max_allowed })
})

const transcriptSegments = computed(() => {
  if (transcriptAvailability.value.state !== 'ready') return []
  return transcriptAvailability.value.content.transcript.segments.map((segment: TranscriptSegment) => ({
    ...segment,
    text: segment.words?.map(w => w.word).join(' ') || ''
  })).filter(s => s.text)
})

async function loadPermission() {
  if (!props.call?.phoneNumberId || !props.call?.waId) return
  loadingPermission.value = true
  justRequested.value = false
  try {
    const response = await permissionService.check(props.call.phoneNumberId, props.call.waId)
    permission.value = response.data
  } catch {
    permission.value = null
  } finally {
    loadingPermission.value = false
  }
}

async function requestPermission() {
  if (!props.call?.phoneNumberId || !props.call?.waId) return
  requesting.value = true
  try {
    await permissionService.request(props.call.phoneNumberId, props.call.waId)
    toast.add({
      title: t('components.callOutbound.requestSentTitle'),
      description: t('components.callOutbound.requestSentDescription'),
      icon: 'i-lucide-send',
      color: 'success'
    })
    justRequested.value = true
  } catch {
    // Error notification handled by interceptor
  } finally {
    requesting.value = false
  }
}

async function handleCallOutbound() {
  if (!props.call?.phoneNumberId || !props.call?.waId) return
  calling.value = true
  try {
    await callOutbound(props.call.phoneNumberId, props.call.waId)
  } finally {
    calling.value = false
  }
}

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

async function loadTranscript() {
  if (!props.call?.transcriptionEnabled) return
  loadingTranscript.value = true
  try {
    transcriptAvailability.value = await callService.getTranscriptAvailability(props.call.id)
  } catch {
    transcriptAvailability.value = { state: 'not_ready' }
  } finally {
    loadingTranscript.value = false
  }
}

function loadDetailData() {
  if (!open.value || !props.call) return
  if (props.call.phoneNumberId && props.call.waId) {
    loadPermission()
  }
  if (props.call.recordingEnabled) {
    loadRecording()
  }
  if (props.call.transcriptionEnabled) {
    loadTranscript()
  }
}

watch([open, () => props.call], () => {
  loadDetailData()
}, { immediate: true })
</script>
