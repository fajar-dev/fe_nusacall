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

      <div
        v-for="call in currentList"
        :key="call.id"
        class="flex items-center gap-3 p-3 pr-5 mb-1 border-l-5"
        :style="{ borderLeftColor: colorFor(call) }"
      >
        <div class="min-w-0 flex-1 flex items-center gap-2.5">
          <UIcon
            :name="getCallIcon(call)"
            class="size-5 shrink-0"
            :class="getCallIconColor(call)"
          />
          <div class="min-w-0 flex-1">
            <p class="text-base font-medium text-highlighted truncate leading-snug">
              {{ call.contact?.profileName || call.waId }}
            </p>
            <p class="text-xs text-muted truncate leading-normal">
              {{ call.waId }}
            </p>
          </div>
        </div>

        <UButton
          v-if="activeTab === 'queue'"
          size="sm"
          icon="i-lucide-phone"
          :disabled="softphoneState !== 'idle'"
          :loading="answeringWacid === call.wacid"
          @click="onAnswer(call)"
        >
          {{ $t('components.callBoard.answer') }}
        </UButton>
        <span
          v-else
          class="text-xs text-muted shrink-0 font-medium"
        >
          {{ formatCallDate(call.createdAt) }}
        </span>
      </div>

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
import type { Call } from '~/types/call'
import type { BoardTab } from '~/composables/useCallBoard'

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
const { state: softphoneState, answerCall } = useSoftphone()

const activeTab = ref<BoardTab>('queue')
const answeringWacid = ref<string | null>(null)

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

function getCallIcon(call: Call): string {
  if (call.status === 'missed') {
    return 'i-lucide-phone-missed'
  }
  if (call.status === 'rejected' || call.status === 'failed' || call.status === 'abandoned') {
    return 'i-lucide-x'
  }
  if (call.direction === 'outbound') {
    return 'i-lucide-phone-outgoing'
  }
  return 'i-lucide-phone-incoming'
}

function getCallIconColor(call: Call): string {
  const isFailed = ['missed', 'rejected', 'failed', 'abandoned'].includes(call.status)
  return isFailed ? 'text-red-500' : 'text-green-500'
}

function formatCallDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return '—'

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)

  if (date >= todayStart) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${hours}:${minutes}`
  } else if (date >= yesterdayStart) {
    return t('components.callBoard.yesterday')
  } else {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = String(date.getFullYear()).slice(-2)
    return `${day}/${month}/${year}`
  }
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

onMounted(init)
</script>
