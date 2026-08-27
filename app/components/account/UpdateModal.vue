<template>
  <UModal
    v-model:open="open"
    :title="$t('pages.account.updateModal.title')"
    :ui="{ content: 'sm:max-w-xl', footer: 'justify-end' }"
  >
    <template #body>
      <div
        v-if="form"
        class="space-y-4"
      >
        <UFormField
          :label="$t('pages.account.updateModal.label')"
          required
        >
          <UInput
            v-model="form.label"
            class="w-full"
          />
        </UFormField>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField :label="$t('pages.account.updateModal.callingEnabled')">
            <div class="flex items-center pt-1.5">
              <USwitch v-model="form.callingEnabled" />
            </div>
          </UFormField>

          <UFormField :label="$t('pages.account.updateModal.answerTimeout')">
            <UInput
              v-model.number="form.answerTimeoutSeconds"
              type="number"
              :min="5"
              :max="25"
              class="w-full"
            />
          </UFormField>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField :label="$t('pages.account.updateModal.iconVisibility')">
            <USelect
              v-model="form.callIconVisibility"
              :items="iconVisibilityOptions"
              class="w-full"
            />
          </UFormField>

          <UFormField :label="$t('pages.account.updateModal.color')">
            <div class="flex items-center gap-2.5 h-9 px-3 rounded-md border border-default bg-elevated w-full">
              <input
                v-model="form.color"
                type="color"
                class="size-5 rounded cursor-pointer border-0 p-0 bg-transparent shrink-0"
              >
              <span class="text-sm text-default uppercase">{{ form.color }}</span>
            </div>
          </UFormField>
        </div>

        <UFormField :label="$t('pages.account.updateModal.callHours')">
          <div class="rounded-lg border border-default p-4 bg-muted/20">
            <AccountCallHoursForm
              ref="callHoursFormRef"
              v-model="form.callHours"
            />
          </div>
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="outline"
          @click=" () => { open = false }"
        >
          {{ $t('pages.account.updateModal.cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          @click="save"
        >
          {{ $t('pages.account.updateModal.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { accountService, type UpdateAccountPayload } from '~/services/account-service'
import type { Account } from '~/types/account'

const props = defineProps<{ account: Account | null }>()
const emit = defineEmits<{ updated: [Account] }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()

const form = ref<UpdateAccountPayload | null>(null)
const saving = ref(false)
const callHoursFormRef = ref<{ isValid: boolean } | null>(null)

const iconVisibilityOptions = computed(() => [
  { label: t('pages.account.updateModal.iconDefault'), value: 'DEFAULT' },
  { label: t('pages.account.updateModal.iconDisabled'), value: 'DISABLE_ALL' }
])

watch(() => props.account, (acc) => {
  if (!acc) return
  form.value = {
    label: acc.label,
    callingEnabled: acc.callingEnabled,
    callIconVisibility: acc.callIconVisibility,
    color: acc.color,
    answerTimeoutSeconds: acc.answerTimeoutSeconds,
    callHours: acc.callHours
  }
}, { immediate: true })

async function save() {
  if (!props.account || !form.value) return
  if (callHoursFormRef.value && !callHoursFormRef.value.isValid) return

  saving.value = true
  try {
    const response = await accountService.update(props.account.id, form.value)
    if (response.success) {
      toast.add({ title: t('pages.account.updateModal.savedSuccess'), color: 'success', icon: 'i-lucide-circle-check' })
      emit('updated', response.data)
      open.value = false
    }
  } finally {
    saving.value = false
  }
}
</script>
