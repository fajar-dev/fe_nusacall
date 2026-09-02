<template>
  <div :class="panelClasses">
    <div class="px-4 pt-5 flex items-center justify-between shrink-0">
      <h2 class="text-xl md:text-2xl font-bold text-highlighted tracking-tight">
        {{ $t('components.callBoard.title') }}
      </h2>
      <UButton
        icon="i-lucide-x"
        variant="ghost"
        color="neutral"
        size="sm"
        class="lg:hidden"
        @click="() => { open = false }"
      />
    </div>

    <div class="px-4 pb-4 pt-3 shrink-0">
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        class="w-full"
        :placeholder="t('components.callBoard.searchPlaceholder')"
      />
    </div>

    <UTabs
      v-model="activeTab"
      :items="tabs"
      :content="false"
      :ui="{
        list: 'bg-primary-50 dark:bg-muted p-1 gap-1 justify-around w-full',
        indicator: 'hidden',
        trigger: 'grow flex-col gap-0.5 py-1 data-[state=active]:bg-default data-[state=active]:shadow-xs data-[state=active]:text-highlighted',
        label: 'text-xs'
      }"
      class="w-full shrink-0 px-4 pb-4 pt-0"
    >
      <template #leading="{ item }">
        <span
          v-if="item.count !== undefined"
          class="relative"
        >
          <span
            class="block text-lg font-bold leading-tight"
            :class="item.value === activeTab ? 'text-highlighted' : 'text-muted'"
          >
            {{ item.count }}
          </span>
          <span
            v-if="item.count > 0 && item.value !== activeTab"
            class="absolute -top-0.5 -right-2 rounded-full bg-primary"
          />
        </span>
        <UIcon
          v-else
          :name="item.icon"
          class="size-5"
          :class="item.value === activeTab ? 'text-highlighted' : 'text-muted'"
        />
      </template>
    </UTabs>

    <div
      class="flex-1 overflow-y-auto"
      @scroll="onScroll"
    >
      <div
        v-if="currentList.length === 0 && isLoadingMore"
        class="p-6 flex justify-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="animate-spin size-5 text-muted"
        />
      </div>
      <p
        v-else-if="currentList.length === 0"
        class="p-6 text-center text-sm text-muted"
      >
        {{ $t('components.callBoard.empty') }}
      </p>

      <component
        :is="call.contact ? NuxtLink : 'div'"
        v-for="call in currentList"
        :key="call.id"
        :to="call.contact ? `/contact/${call.contact.id}` : undefined"
        class="flex items-center gap-3 p-3 pr-5 mb-1 border-l-5 hover:bg-neutral-100/80 dark:hover:bg-neutral-950/60"
        :class="call.contact ? 'cursor-pointer' : ''"
        :style="{ borderLeftColor: colorFor(call) }"
      >
        <div class="min-w-0 flex-1 flex items-center gap-2.5">
          <UIcon
            :name="callIcon(call)"
            class="size-5 shrink-0"
            :class="callIconColor(call)"
          />
          <div class="min-w-0 flex-1">
            <p class="text-base font-medium text-highlighted truncate leading-snug">
              {{ call.contact?.name || formatPhoneNumber(call.contact?.phoneNumber) }}
            </p>
            <p class="text-sm text-muted truncate leading-normal">
              {{ formatPhoneNumber(call.contact?.phoneNumber) }}
            </p>
            <p
              v-if="call.user"
              class="text-xs text-dimmed truncate leading-normal flex items-center gap-1.5"
            >
              <span class="truncate">{{ call.user.name }}</span>
              <span
                v-if="displayDuration(call)"
                class="shrink-0 text-success/80"
              >( {{ displayDuration(call) }} )</span>
            </p>
          </div>
        </div>

        <div
          v-if="activeTab === 'queue'"
          class="flex items-center gap-2 shrink-0"
        >
          <UButton
            icon="i-lucide-phone"
            color="success"
            size="sm"
            class="rounded-full"
            :disabled="softphoneState !== 'idle'"
            :loading="answeringWacid === call.wacid"
            :aria-label="$t('components.callBoard.answer')"
            @click.stop.prevent="onAnswer(call)"
          />
          <UButton
            icon="i-lucide-phone-off"
            color="error"
            size="sm"
            class="rounded-full"
            :disabled="softphoneState !== 'idle' || rejectingWacid === call.wacid"
            :loading="rejectingWacid === call.wacid"
            :aria-label="$t('components.callBoard.reject')"
            @click.stop.prevent="onReject(call)"
          />
        </div>
        <span
          v-else
          class="text-sm text-primary shrink-0"
        >
          {{ callDate(call.createdAt) }}
        </span>
      </component>

      <div
        v-if="currentList.length > 0 && isLoadingMore"
        class="p-3 flex justify-center"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="animate-spin size-4 text-muted"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
import type { Call } from '~/types/call'
import type { BoardTab } from '~/composables/useCallBoard'
import { callIcon, callIconColor } from '~/utils/call'
import { formatCallDate, formatDuration, formatPhoneNumber } from '~/utils/format'

const NuxtLink = resolveComponent('NuxtLink')

const { t } = useI18n()
const open = useState<boolean>('call-board-open', () => false)

const {
  queue,
  ongoing,
  history,
  queueLoading,
  ongoingLoading,
  historyLoading,
  phoneNumberColors,
  searchQuery,
  init,
  loadMore
} = useCallBoard()
const { state: softphoneState, answerCall, rejectCall } = useSoftphone()

const activeTab = ref<BoardTab>('queue')
const answeringWacid = ref<string | null>(null)
const rejectingWacid = ref<string | null>(null)

const nowTick = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | undefined

const panelClasses = computed(() => [
  'h-full bg-default border-r border-default shrink-0 flex-col transition-transform duration-200',
  'fixed inset-y-0 left-0 z-40 w-full sm:w-96 shadow-2xl',
  'lg:static lg:z-auto lg:w-82.5 lg:shadow-none lg:flex lg:translate-x-0',
  open.value ? 'flex translate-x-0' : 'hidden -translate-x-full'
])

const tabs = computed(() => [
  { value: 'queue', label: t('components.callBoard.queue'), count: queue.value.length },
  { value: 'ongoing', label: t('components.callBoard.ongoing'), count: ongoing.value.length },
  { value: 'history', label: t('components.callBoard.history'), icon: 'i-lucide-history' }
])

const currentList = computed<Call[]>(() => {
  if (activeTab.value === 'queue') return queue.value
  if (activeTab.value === 'ongoing') return ongoing.value
  return history.value
})

const isLoadingMore = computed(() => {
  if (activeTab.value === 'queue') return queueLoading.value
  if (activeTab.value === 'ongoing') return ongoingLoading.value
  return historyLoading.value
})

function onScroll(e: Event) {
  const el = e.target as HTMLElement
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 80) {
    loadMore(activeTab.value)
  }
}

function colorFor(call: Call): string {
  return phoneNumberColors.value[call.phoneNumberId] || 'transparent'
}

async function onAnswer(call: Call) {
  answeringWacid.value = call.wacid
  try {
    const ok = await answerCall(call.wacid)
    if (ok) open.value = false
  } finally {
    answeringWacid.value = null
  }
}

function callDate(dateStr: string | null | undefined): string {
  return formatCallDate(dateStr, t('components.callBoard.yesterday'))
}

function onReject(call: Call) {
  rejectingWacid.value = call.wacid
  rejectCall(call.wacid)
  rejectingWacid.value = null
}

function displayDuration(call: Call): string | null {
  if (call.status === 'active' && call.answeredAt) {
    const elapsed = Math.max(0, Math.floor((nowTick.value - new Date(call.answeredAt).getTime()) / 1000))
    return formatDuration(elapsed)
  }
  if (call.durationSeconds != null) return formatDuration(call.durationSeconds)
  return null
}

onMounted(() => {
  init()
  tickTimer = setInterval(() => (nowTick.value = Date.now()), 1000)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})
</script>
