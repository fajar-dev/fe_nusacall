<template>
  <span class="font-mono tabular-nums">{{ formatted }}</span>
</template>

<script setup lang="ts">
const props = defineProps<{ since: number | null }>()

const now = ref(Date.now())
let interval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  interval = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const formatted = computed(() => {
  if (!props.since) return '00:00'
  const totalSeconds = Math.max(0, Math.floor((now.value - props.since) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})
</script>
