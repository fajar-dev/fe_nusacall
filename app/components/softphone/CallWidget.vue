<template>
  <div>
    <div
      v-if="state === 'active' || state === 'connecting'"
      class="fixed bottom-4 right-4 z-30 w-72"
    >
      <UCard :ui="{ body: 'flex flex-col gap-3 p-4' }">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="relative flex size-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span class="text-sm font-medium text-highlighted">{{ $t('components.softphone.active.title') }}</span>
          </div>
          <span class="tabular-nums">{{ formattedTimer }}</span>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            :color="muted ? 'primary' : 'neutral'"
            variant="subtle"
            :icon="muted ? 'i-lucide-mic-off' : 'i-lucide-mic'"
            class="flex-1 justify-center"
            @click="toggleMute"
          >
            {{ muted ? $t('components.softphone.active.unmute') : $t('components.softphone.active.mute') }}
          </UButton>
          <UButton
            color="error"
            icon="i-lucide-phone-off"
            class="flex-1 justify-center"
            @click="hangup"
          >
            {{ $t('components.softphone.active.hangup') }}
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { state, answeredAt, setMuted, hangup, init } = useSoftphone()

const muted = ref(false)
const now = ref(Date.now())
let interval: ReturnType<typeof setInterval> | null = null

const formattedTimer = computed(() => {
  if (!answeredAt.value) return '00:00'
  const totalSeconds = Math.max(0, Math.floor((now.value - answeredAt.value) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function toggleMute() {
  muted.value = !muted.value
  setMuted(muted.value)
}

onMounted(() => {
  init()
  interval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
