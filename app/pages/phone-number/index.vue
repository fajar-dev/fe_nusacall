<template>
  <div class="space-y-6">
    <Header
      :title="$t('pages.phoneNumber.title')"
      :description="$t('pages.phoneNumber.description')"
    />

    <div
      v-if="isLoading"
      class="text-sm text-muted"
    >
      {{ $t('pages.phoneNumber.loading') }}
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <UCard
        v-for="pn in phoneNumbers"
        :key="pn.id"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium text-highlighted">
                {{ pn.label }}
              </h3>
              <p class="text-sm text-muted">
                {{ pn.displayPhoneNumber }}
              </p>
            </div>
            <UBadge
              :color="pn.callingEnabled ? 'success' : 'neutral'"
              variant="subtle"
            >
              {{ pn.callingEnabled ? $t('pages.phoneNumber.enabled') : $t('pages.phoneNumber.disabled') }}
            </UBadge>
          </div>

          <UBadge
            v-if="pn.isTestNumber"
            color="warning"
            variant="subtle"
            class="w-fit"
          >
            {{ $t('pages.phoneNumber.testNumber') }}
          </UBadge>

          <div class="text-xs text-dimmed space-y-0.5">
            <p>{{ $t('pages.phoneNumber.answerTimeout') }}: {{ pn.answerTimeoutSeconds }}s</p>
            <p>{{ $t('pages.phoneNumber.lastSynced') }}: {{ pn.lastSyncedAt ? formatRelative(pn.lastSyncedAt) : '—' }}</p>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-pencil"
              @click="openEdit(pn)"
            >
              {{ $t('pages.phoneNumber.edit') }}
            </UButton>
            <UButton
              size="sm"
              color="neutral"
              variant="outline"
              icon="i-lucide-refresh-cw"
              :loading="syncingId === pn.id"
              @click="doSync(pn)"
            >
              {{ $t('pages.phoneNumber.sync') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>

    <PhoneNumberUpdateModal
      v-model:open="editOpen"
      :phone-number="selected"
      @updated="handleUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { phoneNumberService } from '~/services/phone-number-service'
import type { PhoneNumber } from '~/types/phone-number'

definePageMeta({
  layout: 'dashboard'
})

const { t } = useI18n()
const toast = useToast()

const phoneNumbers = ref<PhoneNumber[]>([])
const isLoading = ref(true)
const editOpen = ref(false)
const selected = ref<PhoneNumber | null>(null)
const syncingId = ref<number | null>(null)

async function fetchPhoneNumbers() {
  isLoading.value = true
  try {
    const response = await phoneNumberService.getAll()
    if (response.success) phoneNumbers.value = response.data
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchPhoneNumbers)

function openEdit(pn: PhoneNumber) {
  selected.value = pn
  editOpen.value = true
}

function handleUpdated(updated: PhoneNumber) {
  const index = phoneNumbers.value.findIndex(p => p.id === updated.id)
  if (index !== -1) phoneNumbers.value[index] = updated
}

async function doSync(pn: PhoneNumber) {
  syncingId.value = pn.id
  try {
    const response = await phoneNumberService.sync(pn.id)
    if (response.success) {
      handleUpdated(response.data)
      toast.add({ title: t('pages.phoneNumber.syncSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
    }
  } catch {
    // handleServiceError already showed a toast.
  } finally {
    syncingId.value = null
  }
}

const relativeFormatter = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
function formatRelative(iso: string): string {
  const diffMinutes = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (Math.abs(diffMinutes) < 60) return relativeFormatter.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return relativeFormatter.format(diffHours, 'hour')
  return relativeFormatter.format(Math.round(diffHours / 24), 'day')
}
</script>
