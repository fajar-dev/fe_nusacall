<template>
  <UDropdownMenu
    :items="items"
    :content="{ side: 'right', sideOffset: 12, align: 'end' }"
  >
    <button
      type="button"
      class="flex flex-col items-center justify-center w-full py-1 px-1 rounded-xl transition-colors cursor-pointer group text-muted hover:text-highlighted"
      :aria-label="$t(`components.softphone.availability.${availability}`)"
    >
      <div
        class="w-14 h-8.5 rounded-full flex items-center justify-center transition-all duration-200 group-hover:bg-muted/60"
        :class="dotClass"
      >
        <UIcon
          :name="icon"
          class="w-[22px] h-[22px] shrink-0 transition-transform group-hover:scale-105"
        />
      </div>
      <span class="text-xs font-medium mt-0.5 text-center truncate max-w-full leading-tight text-muted group-hover:text-highlighted">
        {{ $t(`components.softphone.availability.${availability}`) }}
      </span>
    </button>

    <template #item-trailing="{ item }">
      <UIcon
        v-if="item.active"
        name="i-lucide-check"
        class="size-4 text-primary shrink-0"
      />
    </template>
  </UDropdownMenu>
</template>

<script setup lang="ts">
import type { AgentAvailability } from '~/types/agent'

const { t } = useI18n()
const toast = useToast()
const { availability, setAvailability } = useSoftphone()

const dotClassByAvailability: Record<AgentAvailability, string> = {
  available: 'text-success',
  busy: 'text-warning',
  away: 'text-muted',
  offline: 'text-muted'
}
const dotClass = computed(() => dotClassByAvailability[availability.value])
const icon = computed(() => availability.value === 'available' ? 'i-lucide-circle-check' : 'i-lucide-circle-dashed')

const options: AgentAvailability[] = ['available', 'busy', 'away', 'offline']

async function select(next: AgentAvailability) {
  const ok = await setAvailability(next)
  if (!ok) {
    toast.add({
      title: t('components.softphone.micDeniedTitle'),
      description: t('components.softphone.micDeniedDescription'),
      color: 'error',
      icon: 'i-lucide-mic-off'
    })
  }
}

const items = computed(() =>
  options.map(opt => ({
    label: t(`components.softphone.availability.${opt}`),
    active: availability.value === opt,
    onSelect: () => select(opt)
  }))
)
</script>
