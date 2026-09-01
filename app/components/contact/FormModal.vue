<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? $t('pages.contact.form.editTitle') : $t('pages.contact.form.createTitle')"
    :ui="{ content: 'sm:max-w-lg', footer: 'justify-end' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField
          :label="$t('pages.contact.form.name')"
          required
        >
          <UInput
            v-model="form.name"
            :placeholder="$t('pages.contact.form.namePlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="$t('pages.contact.form.phoneNumber')"
          required
        >
          <UInput
            v-model="form.phoneNumber"
            :placeholder="$t('pages.contact.form.phoneNumberPlaceholder')"
            class="w-full"
          >
            <template #leading>
              <span class="text-sm text-muted">+62</span>
            </template>
          </UInput>
        </UFormField>

        <UFormField :label="$t('pages.contact.form.timeZone')">
          <USelectMenu
            v-model="form.timeZone"
            :items="timezoneItems"
            :placeholder="$t('pages.contact.form.timeZonePlaceholder')"
            class="w-full"
          />
        </UFormField>

        <UFormField :label="$t('pages.contact.form.branch')">
          <USelectMenu
            v-model="selectedBranch"
            :items="branchItems"
            value-key="value"
            :placeholder="$t('pages.contact.form.branchPlaceholder')"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center justify-end gap-2 w-full">
        <UButton
          color="neutral"
          variant="outline"
          @click="() => { open = false }"
        >
          {{ $t('pages.contact.form.cancel') }}
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          :disabled="!canSave"
          @click="save"
        >
          {{ $t('pages.contact.form.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { contactService } from '~/services/contact-service'
import { branchService } from '~/services/branch-service'
import { TIMEZONES } from '~/enums/timezone'
import type { Timezone } from '~/enums/timezone'
import type { Contact } from '~/types/contact'
import type { BranchListItem } from '~/types/branch'

const props = defineProps<{ contact: Contact | null }>()
const emit = defineEmits<{ saved: [] }>()
const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const toast = useToast()

const saving = ref(false)
const branches = ref<BranchListItem[]>([])
const selectedBranch = ref<number | null>(null)

const form = reactive<{ name: string, phoneNumber: string, timeZone: Timezone }>({
  name: '',
  phoneNumber: '',
  timeZone: 'UTC'
})

const COUNTRY_CODE = '62'

function toLocalPart(phoneNumber?: string | null): string {
  const digits = (phoneNumber ?? '').replace(/\D/g, '')
  return digits.startsWith(COUNTRY_CODE) ? digits.slice(COUNTRY_CODE.length) : digits
}

function toInternational(localPart: string): string {
  const digits = localPart.replace(/\D/g, '').replace(/^0+/, '')
  return digits ? COUNTRY_CODE + digits : ''
}

const timezoneItems = [...TIMEZONES]
const isEdit = computed(() => props.contact !== null)
const canSave = computed(() => toInternational(form.phoneNumber).length >= 8)

const branchItems = computed(() => [
  { label: t('pages.contact.form.branchNone'), value: null },
  ...branches.value.map(branch => ({ label: branch.name, value: branch.id }))
])

async function fetchBranches() {
  const response = await branchService.getList()
  if (response.success) branches.value = response.data
}

watch(open, (isOpen) => {
  if (!isOpen) return
  if (!branches.value.length) fetchBranches()

  form.name = props.contact?.name ?? ''
  form.phoneNumber = toLocalPart(props.contact?.phoneNumber)
  form.timeZone = props.contact?.timeZone ?? 'UTC'
  selectedBranch.value = props.contact?.branch?.id ?? null
}, { immediate: true })

async function save() {
  saving.value = true
  try {
    const payload = {
      phoneNumber: toInternational(form.phoneNumber),
      name: form.name.trim() || null,
      timeZone: form.timeZone,
      branchId: selectedBranch.value
    }

    const response = props.contact
      ? await contactService.update(props.contact.id, payload)
      : await contactService.create(payload)

    if (response.success) {
      toast.add({
        title: t(props.contact ? 'pages.contact.form.updated' : 'pages.contact.form.created'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('saved')
      open.value = false
    }
  } finally {
    saving.value = false
  }
}
</script>
