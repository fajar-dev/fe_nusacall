<template>
  <div>
    <p
      v-if="loading"
      class="text-xs text-dimmed"
    >
      {{ $t('components.callRecording.loading') }}
    </p>

    <p
      v-else-if="availability.state === 'expired'"
      class="text-xs text-dimmed flex items-center gap-1.5"
    >
      <UIcon
        name="i-lucide-clock-alert"
        class="size-3.5 shrink-0"
      />
      {{ $t('components.callRecording.expired') }}
    </p>

    <p
      v-else-if="availability.state === 'not_ready'"
      class="text-xs text-dimmed"
    >
      {{ $t('components.callRecording.notReady') }}
    </p>

    <ul
      v-else-if="segments.length"
      class="space-y-2.5 max-h-64 overflow-y-auto pr-1"
    >
      <li
        v-for="(segment, i) in segments"
        :key="i"
        class="flex gap-2 text-sm"
      >
        <span class="text-xs text-dimmed font-mono shrink-0 w-10 pt-0.5">{{ formatTimestamp(segment.start) }}</span>
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
      {{ availability.state === 'ready' ? availability.content.transcript.text : '' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { callService } from '~/services/call-service'
import type { TranscriptAvailability, TranscriptSegment } from '~/types/call'

const props = defineProps<{ callId: number }>()

const loading = ref(true)
const availability = ref<TranscriptAvailability>({ state: 'not_ready' })

onMounted(async () => {
  try {
    availability.value = await callService.getTranscriptAvailability(props.callId)
  } finally {
    loading.value = false
  }
})

// Meta's segments carry `words[]`, not a flat `text` — join them for display.
const segments = computed(() => {
  if (availability.value.state !== 'ready') return []
  return availability.value.content.transcript.segments.map((segment: TranscriptSegment) => ({
    ...segment,
    text: segment.words?.map(w => w.word).join(' ') || ''
  })).filter(s => s.text)
})

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
</script>
