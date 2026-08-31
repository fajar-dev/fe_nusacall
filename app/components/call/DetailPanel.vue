<template>
  <aside
    v-if="open"
    class="h-full w-full sm:w-96 shrink-0 border-l border-default bg-default flex flex-col"
  >
    <header class="shrink-0 flex items-center gap-2 px-4 h-14 border-b border-default">
      <h2 class="text-sm font-semibold text-highlighted">
        {{ $t('pages.call.detail.title') }}
      </h2>
      <UBadge
        v-if="call"
        color="neutral"
        variant="subtle"
        size="sm"
        class="tabular-nums"
      >
        #{{ call.id }}
      </UBadge>
      <UButton
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="sm"
        class="ml-auto"
        :aria-label="$t('pages.call.detail.close')"
        @click="close"
      />
    </header>

    <div
      v-if="call"
      class="flex-1 overflow-y-auto"
    >
      <div class="px-4 py-5 flex items-center gap-3">
        <UIcon
          :name="callIcon(call)"
          class="size-5 shrink-0 mt-0.5"
          :class="callIconColor(call)"
        />
        <div class="min-w-0">
          <p class="text-base font-medium text-highlighted truncate leading-snug">
            {{ call.contact?.name || formatPhoneNumber(call.contact?.phoneNumber) || '—' }}
          </p>
          <p class="text-sm text-muted truncate leading-normal">
            {{ formatPhoneNumber(call.contact?.phoneNumber) }}
          </p>
        </div>
      </div>

      <dl class="px-4 pb-5 space-y-3 text-sm">

        <div class="flex items-baseline gap-3">
          <dt class="w-20 shrink-0 text-muted">
            {{ $t('pages.call.detail.duration') }}
          </dt>
          <dd class="min-w-0 flex-1 text-highlighted tabular-nums">
            {{ call.durationSeconds != null ? formatDuration(call.durationSeconds) : '—' }}
          </dd>
        </div>

        <div class="flex items-baseline gap-3">
          <dt class="w-20 shrink-0 text-muted">
            {{ $t('pages.call.columnAccount') }}
          </dt>
          <dd class="min-w-0 flex-1">
            <span class="block text-highlighted truncate">{{ call.account?.label || '—' }}</span>
            <span
              v-if="call.account"
              class="block text-muted truncate"
            >{{ formatPhoneNumber(call.account.displayPhoneNumber) }}</span>
          </dd>
        </div>

        <div class="flex items-start gap-3">
          <dt class="w-20 shrink-0 text-muted pt-1">
            {{ $t('pages.call.detail.agent') }}
          </dt>
          <dd class="min-w-0 flex-1">
            <span
              v-if="call.user"
              class="flex items-center gap-2 min-w-0"
            >
              <UAvatar
                :src="call.user.photo ?? undefined"
                :alt="call.user.name"
              />
              <span class="min-w-0">
                <span class="block text-highlighted truncate">{{ call.user.name }}</span>
                <span class="block text-xs text-muted truncate">{{ call.user.email }}</span>
              </span>
            </span>
            <span
              v-else
              class="text-highlighted"
            >—</span>
          </dd>
        </div>
      </dl>

      <UAlert
        v-if="call.errorMessage"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="$t('pages.call.detail.error')"
        :description="call.errorMessage"
        class="mx-4 mb-5"
      />

      <section class="px-4 py-5 border-t border-default">
        <h3 class="text-xs font-medium text-muted mb-4">
          {{ $t('pages.call.detail.timeline') }}
        </h3>
        <UTimeline
          :items="timeline"
          size="xs"
          :default-value="-1"
          :ui="{
            indicator: 'bg-elevated text-muted ring ring-default',
            separator: 'bg-default',
            date: 'text-dimmed text-xs',
            title: 'text-highlighted font-normal text-sm'
          }"
        />
      </section>

      <section
        v-if="call.recordingEnabled"
        class="px-4 py-5 border-t border-default"
      >
        <h3 class="text-xs font-medium text-muted mb-3">
          {{ $t('pages.call.detail.recording') }}
        </h3>
        <USkeleton
          v-if="loadingRecording"
          class="h-9 w-full rounded-md"
        />
        <template v-else-if="recordingAvailability.state === 'ready'">
          <audio
            :src="recordingAvailability.url"
            controls
            preload="none"
            class="w-full h-9 rounded-md"
          />
          <p class="text-xs text-dimmed mt-2">
            {{ $t('components.callRecording.stereoHint') }}
          </p>
        </template>
        <p
          v-else
          class="text-xs text-dimmed"
        >
          {{ $t('components.callRecording.notReady') }}
        </p>
      </section>
      <footer
        v-if="technical.length"
        class="px-4 py-4 border-t border-default flex flex-wrap gap-x-4 gap-y-1"
      >
        <span
          v-for="fact in technical"
          :key="fact"
          class="text-xs text-dimmed tabular-nums"
        >{{ fact }}</span>
      </footer>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { callService } from '~/services/call-service'
import { formatClockTime, formatDuration, formatPhoneNumber } from '~/utils/format'
import { callIcon, callIconColor } from '~/utils/call'
import type { RecordingAvailability } from '~/types/call'

const { call, open, close } = useCallDetail()
const { t } = useI18n()

const loadingRecording = ref(false)
const recordingAvailability = ref<RecordingAvailability>({ state: 'not_ready' })

const timeline = computed(() => {
  if (!call.value) return []
  return [
    { title: t('pages.call.detail.created'), date: formatClockTime(call.value.createdAt), icon: 'i-lucide-inbox' },
    { title: t('pages.call.detail.ringing'), date: formatClockTime(call.value.ringingAt), icon: 'i-lucide-bell' },
    { title: t('pages.call.detail.answered'), date: formatClockTime(call.value.answeredAt), icon: 'i-lucide-phone' },
    { title: t('pages.call.detail.ended'), date: formatClockTime(call.value.endedAt), icon: 'i-lucide-phone-off' }
  ].filter(event => event.date !== '—')
})

const technical = computed(() => {
  if (!call.value) return []
  const facts: string[] = []
  if (call.value.setupDurationMs != null) {
    facts.push(`${t('pages.call.detail.setupDuration')}: ${call.value.setupDurationMs}ms`)
  }
  if (call.value.errorCode) {
    facts.push(`${t('pages.call.detail.errorCode')}: ${call.value.errorCode}`)
  }
  return facts
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
