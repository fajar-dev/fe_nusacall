<template>
  <div>
    <p
      v-if="loading"
      class="text-xs text-dimmed"
    >
      {{ $t('components.callRecording.loading') }}
    </p>
    <audio
      v-else-if="availability.state === 'ready'"
      :src="availability.url"
      controls
      preload="none"
      class="w-full h-9"
    />
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
      v-else
      class="text-xs text-dimmed"
    >
      {{ $t('components.callRecording.notReady') }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { callService } from '~/services/call-service'
import type { ArtifactAvailability } from '~/types/call'

const props = defineProps<{ callId: number }>()

const loading = ref(true)
const availability = ref<ArtifactAvailability>({ state: 'not_ready' })

onMounted(async () => {
  availability.value = await callService.getRecordingAvailability(props.callId)
  loading.value = false
})
</script>
