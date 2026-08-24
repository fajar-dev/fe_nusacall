<template>
  <UCard :ui="{ body: 'flex flex-col gap-3 p-4' }">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="relative flex size-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span class="relative inline-flex size-2 rounded-full bg-primary" />
        </span>
        <span class="text-sm font-medium text-highlighted">{{ $t('components.softphone.active.title') }}</span>
      </div>
      <SoftphoneCallTimer :since="answeredAt" />
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
</template>

<script setup lang="ts">
const { answeredAt, setMuted, hangup } = useSoftphone()

const muted = ref(false)

function toggleMute() {
  muted.value = !muted.value
  setMuted(muted.value)
}
</script>
