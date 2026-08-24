<template>
  <UModal
    v-model:open="open"
    :dismissible="false"
    :close="false"
    :ui="{ content: 'sm:max-w-sm', overlay: 'backdrop-blur-xs bg-white/10' }"
  >
    <template #content>
      <UCard
        v-if="call"
        :ui="{ body: 'flex flex-col gap-4 relative' }"
      >
        <div class="flex flex-col items-center text-center select-none space-y-3">
          <div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
            <UIcon
              name="i-lucide-phone-incoming"
              class="w-7 h-7 text-primary"
            />
          </div>
          <div class="space-y-1">
            <h3 class="text-base font-medium text-highlighted">
              {{ displayName }}
            </h3>
            <p class="text-sm text-toned">
              {{ call.waId }}
            </p>
            <p
              v-if="call.phoneNumberLabel"
              class="text-xs text-dimmed"
            >
              {{ $t('components.softphone.incoming.to', { label: call.phoneNumberLabel }) }}
            </p>
          </div>

          <UBadge
            v-if="call.isPicMatch"
            color="primary"
            variant="subtle"
            icon="i-lucide-star"
          >
            {{ $t('components.softphone.incoming.picMatch') }}
          </UBadge>

          <p
            v-if="call.lastMessage"
            class="text-sm text-muted line-clamp-2"
          >
            {{ call.lastMessage }}
          </p>

          <div
            v-if="call.tags?.length"
            class="flex flex-wrap gap-1 justify-center"
          >
            <UBadge
              v-for="tag in call.tags"
              :key="tag"
              color="neutral"
              variant="soft"
              size="sm"
            >
              {{ tag }}
            </UBadge>
          </div>

          <p
            class="text-sm font-mono"
            :class="secondsLeft <= 5 ? 'text-error' : 'text-dimmed'"
          >
            {{ secondsLeft }}s
          </p>
        </div>

        <div class="flex items-center gap-3">
          <UButton
            color="error"
            class="flex-1 justify-center"
            icon="i-lucide-phone-off"
            @click="reject()"
          >
            {{ $t('components.softphone.incoming.reject') }}
          </UButton>
          <UButton
            color="primary"
            class="flex-1 justify-center"
            icon="i-lucide-phone"
            @click="answer()"
          >
            {{ $t('components.softphone.incoming.answer') }}
          </UButton>
        </div>

        <a
          v-if="call.nusawaThreadUrl"
          :href="call.nusawaThreadUrl"
          target="_blank"
          rel="noopener"
          class="text-xs text-center text-primary hover:underline"
        >
          {{ $t('components.softphone.incoming.openThread') }}
        </a>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
const { incomingCall, state, answer, reject } = useSoftphone()

const call = computed(() => incomingCall.value)
const open = computed(() => state.value === 'ringing' && !!call.value)

const displayName = computed(() => {
  const c = call.value
  if (!c) return ''
  return c.contactName || c.profileName || c.waId
})

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

const secondsLeft = computed(() => {
  if (!call.value?.expiresAt) return 0
  return Math.max(0, Math.ceil((call.value.expiresAt - now.value) / 1000))
})
</script>
