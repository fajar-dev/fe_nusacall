<template>
  <UModal
    v-model:open="open"
    :ui="{ content: 'sm:max-w-lg' }"
  >
    <template #content>
      <UCard
        v-if="form"
        :ui="{ body: 'flex flex-col gap-4' }"
      >
        <h3 class="text-base font-medium text-highlighted">
          {{ $t('pages.phoneNumber.updateModal.title') }}
        </h3>

        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="$t('pages.phoneNumber.updateModal.propagationWarning')"
        />
        <UAlert
          color="warning"
          variant="subtle"
          icon="i-lucide-triangle-alert"
          :description="$t('pages.phoneNumber.updateModal.iconWarning')"
        />

        <UFormField
          :label="$t('pages.phoneNumber.updateModal.label')"
          required
        >
          <UInput v-model="form.label" />
        </UFormField>

        <UFormField :label="$t('pages.phoneNumber.updateModal.callingEnabled')">
          <USwitch v-model="form.callingEnabled" />
        </UFormField>

        <UFormField :label="$t('pages.phoneNumber.updateModal.iconVisibility')">
          <USelect
            v-model="form.callIconVisibility"
            :items="iconVisibilityOptions"
          />
        </UFormField>

        <UFormField :label="$t('pages.phoneNumber.updateModal.answerTimeout')">
          <UInput
            v-model.number="form.answerTimeoutSeconds"
            type="number"
            :min="5"
            :max="25"
          />
        </UFormField>

        <UFormField :label="$t('pages.phoneNumber.updateModal.callHours')">
          <PhoneNumberCallHoursForm
            ref="callHoursFormRef"
            v-model="form.callHours"
          />
        </UFormField>

        <UFormField
          :label="$t('pages.phoneNumber.updateModal.whitelist')"
          :description="$t('pages.phoneNumber.updateModal.whitelistHint')"
        >
          <UTextarea
            v-model="whitelistText"
            :rows="3"
            placeholder="628123456789"
          />
        </UFormField>

        <div class="flex items-center gap-3 pt-2">
          <UButton
            color="neutral"
            variant="outline"
            class="flex-1 justify-center"
            @click="open = false"
          >
            {{ $t('pages.phoneNumber.updateModal.cancel') }}
          </UButton>
          <UButton
            color="primary"
            class="flex-1 justify-center"
            :loading="saving"
            @click="save"
          >
            {{ $t('pages.phoneNumber.updateModal.save') }}
          </UButton>
        </div>
      </UCard>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { phoneNumberService, type UpdatePhoneNumberPayload } from '~/services/phone-number-service'
import type { PhoneNumber } from '~/types/phone-number'

const props = defineProps<{ phoneNumber: PhoneNumber | null }>()
const emit = defineEmits<{ updated: [PhoneNumber] }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()

const form = ref<UpdatePhoneNumberPayload | null>(null)
const whitelistText = ref('')
const saving = ref(false)
const callHoursFormRef = ref<{ isValid: boolean } | null>(null)

const iconVisibilityOptions = [
  { label: t('pages.phoneNumber.updateModal.iconDefault'), value: 'DEFAULT' },
  { label: t('pages.phoneNumber.updateModal.iconDisabled'), value: 'DISABLE_ALL' }
]

watch(() => props.phoneNumber, (pn) => {
  if (!pn) return
  form.value = {
    label: pn.label,
    callingEnabled: pn.callingEnabled,
    callIconVisibility: pn.callIconVisibility,
    answerTimeoutSeconds: pn.answerTimeoutSeconds,
    callHours: pn.callHours
  }
  whitelistText.value = pn.callerWhitelist.join('\n')
}, { immediate: true })

async function save() {
  if (!props.phoneNumber || !form.value) return
  if (callHoursFormRef.value && !callHoursFormRef.value.isValid) return

  saving.value = true
  try {
    const callerWhitelist = whitelistText.value.split('\n').map(s => s.trim()).filter(Boolean)
    const response = await phoneNumberService.update(props.phoneNumber.id, { ...form.value, callerWhitelist })
    if (response.success) {
      toast.add({ title: t('pages.phoneNumber.updateModal.savedSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      emit('updated', response.data)
      open.value = false
    }
  } catch {
    // handleServiceError already showed a toast.
  } finally {
    saving.value = false
  }
}
</script>
