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
import { Time } from '@internationalized/date'
import type { TimeValue } from 'reka-ui'
import type { CallHours, CallHoursDay } from '~/types/account'

const { t } = useI18n()

const model = defineModel<CallHours | null>({ default: null })

const days: CallHoursDay['day_of_week'][] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

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

function stringToTime(str: string): Time {
  if (!str || str.length < 4) return new Time(8, 0)
  const hours = parseInt(str.slice(0, 2), 10)
  const minutes = parseInt(str.slice(2, 4), 10)
  return new Time(isNaN(hours) ? 8 : hours, isNaN(minutes) ? 0 : minutes)
}

function timeToString(time?: TimeValue | null): string {
  if (!time) return '0800'
  const h = String(time.hour).padStart(2, '0')
  const m = String(time.minute).padStart(2, '0')
  return `${h}${m}`
}

function rangeFor(day: CallHoursDay['day_of_week']): CallHoursDay {
  return model.value?.weekly_operating_hours.find(r => r.day_of_week === day) ?? { day_of_week: day, open_time: '0800', close_time: '1700' }
}

function getDayTimeRange(day: CallHoursDay['day_of_week']) {
  const range = rangeFor(day)
  return {
    start: stringToTime(range.open_time),
    end: stringToTime(range.close_time)
  }
}

function setDayTimeRange(day: CallHoursDay['day_of_week'], rangeObj?: { start?: TimeValue, end?: TimeValue } | null) {
  if (!model.value || !rangeObj) return
  const openTime = timeToString(rangeObj.start)
  const closeTime = timeToString(rangeObj.end)

  const hours = model.value.weekly_operating_hours.map(r =>
    r.day_of_week === day ? { ...r, open_time: openTime, close_time: closeTime } : r
  )
  model.value = { ...model.value, weekly_operating_hours: hours }
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
