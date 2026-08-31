<template>
  <ClientOnly>
    <Teleport to="body">
      <div
        v-if="state === 'active' || state === 'connecting'"
        ref="widgetRef"
        :class="widgetClasses"
        :style="widgetStyle"
      >
        <UCard :ui="{ body: 'flex flex-col gap-3 p-4' }">
          <div
            class="flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
            :title="$t('components.softphone.dragHandle')"
            @pointerdown="startDrag"
          >
            <div class="flex items-center gap-2 min-w-0">
              <UIcon
                name="i-lucide-grip-vertical"
                class="size-4 text-muted shrink-0 cursor-grab active:cursor-grabbing"
              />
              <span class="relative flex size-2 shrink-0">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span class="relative inline-flex size-2 rounded-full bg-primary" />
              </span>
              <span class="text-sm font-medium text-highlighted truncate">{{ $t('components.softphone.active.title') }}</span>
            </div>
            <span class="tabular-nums text-sm font-semibold text-highlighted shrink-0 ml-2">{{ formattedTimer }}</span>
          </div>

          <div
            v-if="contactName || contactPhone"
            class="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 dark:bg-muted/10 border border-default/50 min-w-0"
          >
            <UIcon
              :name="activeCall ? callIcon(activeCall) : 'i-lucide-phone-incoming'"
              class="size-5 shrink-0"
              :class="activeCall ? callIconColor(activeCall) : 'text-green-500'"
            />
            <div class="min-w-0 flex-1">
              <p
                v-if="contactName"
                class="text-sm font-semibold text-highlighted truncate leading-tight"
              >
                {{ contactName }}
              </p>
              <p
                v-if="contactPhone"
                class="text-xs text-muted truncate leading-tight mt-0.5"
              >
                {{ contactPhone }}
              </p>
            </div>
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
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { formatDuration, formatPhoneNumber } from '~/utils/format'
import { callIcon, callIconColor } from '~/utils/call'

const { state, activeWacid, answeredAt, setMuted, hangup, init } = useSoftphone()
const { ongoing, queue } = useCallBoard()

const muted = ref(false)
const now = ref(Date.now())
let interval: ReturnType<typeof setInterval> | null = null

const widgetRef = ref<HTMLElement | null>(null)
const position = ref<{ x: number, y: number }>({ x: 0, y: 0 })
const isDragging = ref(false)
const dragOffset = { x: 0, y: 0 }

const activeCall = computed(() => {
  if (!activeWacid.value) return null
  return ongoing.value.find(c => c.wacid === activeWacid.value)
    || queue.value.find(c => c.wacid === activeWacid.value)
    || null
})

const contactName = computed(() => {
  if (activeCall.value?.contact?.name) return activeCall.value.contact.name
  if (activeCall.value?.contact?.phoneNumber) return formatPhoneNumber(activeCall.value.contact.phoneNumber)
  return null
})

const contactPhone = computed(() => {
  if (activeCall.value?.contact?.name && activeCall.value?.contact?.phoneNumber) {
    return formatPhoneNumber(activeCall.value.contact.phoneNumber)
  }
  return null
})

const formattedTimer = computed(() => {
  if (!answeredAt.value) return '00:00'
  return formatDuration(Math.max(0, (now.value - answeredAt.value) / 1000))
})

function toggleMute() {
  muted.value = !muted.value
  setMuted(muted.value)
}

function startDrag(event: PointerEvent) {
  const target = event.target as HTMLElement
  if (target.closest('button') || target.closest('input') || target.closest('a')) {
    return
  }

  isDragging.value = true
  dragOffset.x = event.clientX - position.value.x
  dragOffset.y = event.clientY - position.value.y

  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', stopDrag)
  window.addEventListener('pointercancel', stopDrag)
}

function onDrag(event: PointerEvent) {
  if (!isDragging.value) return

  const width = widgetRef.value?.offsetWidth || 288
  const height = widgetRef.value?.offsetHeight || 160

  const minX = 8
  const maxX = Math.max(8, window.innerWidth - width - 8)
  const minY = 8
  const maxY = Math.max(8, window.innerHeight - height - 8)

  const newX = Math.max(minX, Math.min(maxX, event.clientX - dragOffset.x))
  const newY = Math.max(minY, Math.min(maxY, event.clientY - dragOffset.y))

  position.value = { x: newX, y: newY }
}

function stopDrag() {
  if (!isDragging.value) return
  isDragging.value = false
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
  window.removeEventListener('pointercancel', stopDrag)
}

const widgetClasses = computed(() => [
  'fixed w-72 transition-shadow duration-200 select-none',
  isDragging.value ? 'shadow-2xl ring-2 ring-primary/40 rounded-2xl' : 'shadow-xl'
])

const widgetStyle = computed(() => ({
  top: `${position.value.y}px`,
  left: `${position.value.x}px`,
  zIndex: 99999
}))

onMounted(() => {
  init()
  interval = setInterval(() => {
    now.value = Date.now()
  }, 1000)

  if (import.meta.client) {
    const width = 288
    const defaultX = Math.max(16, window.innerWidth - width - 24)
    const defaultY = Math.max(16, window.innerHeight - 180)
    position.value = { x: defaultX, y: defaultY }
  }
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
  stopDrag()
})
</script>
