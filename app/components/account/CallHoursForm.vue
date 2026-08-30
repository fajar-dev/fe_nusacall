<template>
  <div class="space-y-4">
    <UFormField :label="$t('pages.account.callHours.enable')">
      <USwitch v-model="enabled" />
    </UFormField>

    <template v-if="enabled">
      <UFormField
        :label="$t('pages.account.callHours.timezone')"
        required
      >
        <USelectMenu
          v-model="timezoneId"
          :items="timezoneOptions"
          class="w-full"
        />
      </UFormField>

      <div class="space-y-3">
        <div
          v-for="day in days"
          :key="day"
          class="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/40 transition-colors"
        >
          <div class="flex items-center gap-3">
            <USwitch
              :model-value="isOpen(day)"
              class="shrink-0"
              @update:model-value="(v) => toggleDay(day, v as boolean)"
            />
            <span class="w-28 text-sm text-toned shrink-0 font-medium">
              {{ $t(`pages.account.callHours.days.${day}`) }}
            </span>
          </div>

          <template v-if="isOpen(day)">
            <UInputTime
              range
              :model-value="getDayTimeRange(day)"
              @update:model-value="(v) => setDayTimeRange(day, v)"
            />
          </template>
          <span
            v-else
            class="text-xs text-dimmed pr-2"
          >
            {{ $t('pages.account.callHours.closed') }}
          </span>
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
import type { TimeValue } from 'reka-ui'
import { parseHHmm, toHHmm } from '~/utils/time'
import { findDayRange, isDayOpen, withDayRange, withDayToggled } from '~/utils/call-hours'
import { DAYS_OF_WEEK } from '~/enums/day-of-week'
import type { CallHours, CallHoursDay } from '~/types/account'

const { t } = useI18n()

const model = defineModel<CallHours | null>({ default: null })

const days = DAYS_OF_WEEK

const timezoneOptions = [
  'Asia/Jakarta',
  'Asia/Makassar',
  'Asia/Jayapura',
  'Asia/Singapore',
  'Asia/Bangkok',
  'Asia/Tokyo',
  'UTC'
]

const enabled = computed({
  get: () => model.value?.status === 'ENABLED',
  set: (value: boolean) => {
    if (value) {
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

function getDayTimeRange(day: CallHoursDay['day_of_week']) {
  const range = findDayRange(model.value?.weekly_operating_hours ?? [], day)
  return {
    start: parseHHmm(range.open_time),
    end: parseHHmm(range.close_time)
  }
}

function setDayTimeRange(day: CallHoursDay['day_of_week'], rangeObj?: { start?: TimeValue, end?: TimeValue } | null) {
  if (!model.value || !rangeObj) return
  const hours = withDayRange(model.value.weekly_operating_hours, day, toHHmm(rangeObj.start), toHHmm(rangeObj.end))
  model.value = { ...model.value, weekly_operating_hours: hours }
}

function isOpen(day: CallHoursDay['day_of_week']): boolean {
  return isDayOpen(model.value?.weekly_operating_hours ?? [], day)
}

function toggleDay(day: CallHoursDay['day_of_week'], open: boolean) {
  if (!model.value) return
  model.value = {
    ...model.value,
    weekly_operating_hours: withDayToggled(model.value.weekly_operating_hours, day, open)
  }
}

const errorMessage = computed(() => {
  if (!model.value) return ''
  for (const range of model.value.weekly_operating_hours) {
    if (!/^\d{4}$/.test(range.open_time) || !/^\d{4}$/.test(range.close_time)) {
      return t('pages.account.callHours.invalidFormat', { day: t(`pages.account.callHours.days.${range.day_of_week}`) })
    }
    if (range.open_time >= range.close_time) {
      return t('pages.account.callHours.invalidRange', { day: t(`pages.account.callHours.days.${range.day_of_week}`) })
    }
  }
  return ''
})

defineExpose({ isValid: computed(() => !errorMessage.value) })
</script>
