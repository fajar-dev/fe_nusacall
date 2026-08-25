<template>
  <div class="space-y-4">
    <UFormField :label="$t('pages.phoneNumber.callHours.enable')">
      <USwitch v-model="enabled" />
    </UFormField>

    <template v-if="enabled">
      <UFormField
        :label="$t('pages.phoneNumber.callHours.timezone')"
        required
      >
        <UInput
          v-model="timezoneId"
          placeholder="Asia/Jakarta"
        />
      </UFormField>

      <div class="space-y-2">
        <div
          v-for="day in days"
          :key="day"
          class="flex items-center gap-3"
        >
          <USwitch
            :model-value="isOpen(day)"
            class="shrink-0"
            @update:model-value="(v) => toggleDay(day, v as boolean)"
          />
          <span class="w-28 text-sm text-toned shrink-0">{{ $t(`pages.phoneNumber.callHours.days.${day}`) }}</span>
          <template v-if="isOpen(day)">
            <UInput
              :model-value="rangeFor(day).open_time"
              placeholder="0800"
              class="w-20"
              @update:model-value="(v) => setTime(day, 'open_time', String(v))"
            />
            <span class="text-muted">–</span>
            <UInput
              :model-value="rangeFor(day).close_time"
              placeholder="1700"
              class="w-20"
              @update:model-value="(v) => setTime(day, 'close_time', String(v))"
            />
          </template>
          <span
            v-else
            class="text-xs text-dimmed"
          >{{ $t('pages.phoneNumber.callHours.closed') }}</span>
        </div>
      </div>

      <p
        v-if="errorMessage"
        class="text-xs text-error"
      >
        {{ errorMessage }}
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { CallHours, CallHoursDay } from '~/types/phone-number'

const { t } = useI18n()

const model = defineModel<CallHours | null>({ default: null })

const days: CallHoursDay['day_of_week'][] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

const enabled = computed({
  get: () => model.value?.status === 'ENABLED',
  set: (value: boolean) => {
    if (value) {
      // One assignment, not two — defineModel() write-through isn't synchronous,
      // so a second read right after the first write would still see the old value.
      model.value = model.value
        ? { ...model.value, status: 'ENABLED' }
        : { status: 'ENABLED', timezone_id: 'Asia/Jakarta', weekly_operating_hours: [] }
    } else {
      model.value = model.value ? { ...model.value, status: 'DISABLED' } : null
    }
  }
})

const timezoneId = computed({
  get: () => model.value?.timezone_id ?? 'Asia/Jakarta',
  set: (value: string) => {
    if (model.value) model.value = { ...model.value, timezone_id: value }
  }
})

function rangeFor(day: CallHoursDay['day_of_week']): CallHoursDay {
  return model.value?.weekly_operating_hours.find(r => r.day_of_week === day) ?? { day_of_week: day, open_time: '0800', close_time: '1700' }
}

function isOpen(day: CallHoursDay['day_of_week']): boolean {
  return !!model.value?.weekly_operating_hours.some(r => r.day_of_week === day)
}

function toggleDay(day: CallHoursDay['day_of_week'], open: boolean) {
  if (!model.value) return
  const hours = model.value.weekly_operating_hours.filter(r => r.day_of_week !== day)
  if (open) hours.push({ day_of_week: day, open_time: '0800', close_time: '1700' })
  model.value = { ...model.value, weekly_operating_hours: hours }
}

function setTime(day: CallHoursDay['day_of_week'], field: 'open_time' | 'close_time', value: string) {
  if (!model.value) return
  const hours = model.value.weekly_operating_hours.map(r => (r.day_of_week === day ? { ...r, [field]: value } : r))
  model.value = { ...model.value, weekly_operating_hours: hours }
}

const errorMessage = computed(() => {
  if (!model.value) return ''
  for (const range of model.value.weekly_operating_hours) {
    if (!/^\d{4}$/.test(range.open_time) || !/^\d{4}$/.test(range.close_time)) {
      return t('pages.phoneNumber.callHours.invalidFormat', { day: t(`pages.phoneNumber.callHours.days.${range.day_of_week}`) })
    }
    if (range.open_time >= range.close_time) {
      return t('pages.phoneNumber.callHours.invalidRange', { day: t(`pages.phoneNumber.callHours.days.${range.day_of_week}`) })
    }
  }
  return ''
})

defineExpose({ isValid: computed(() => !errorMessage.value) })
</script>
