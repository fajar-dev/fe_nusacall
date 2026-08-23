<template>
  <UModal
    v-model:open="open"
    :title="$t('components.contact.updateModal.title')"
    :description="$t('components.contact.updateModal.description')"
color="neutral"
          variant="soft"
          @click="() => { open = false }"
  >
    <template #body>
      <UForm
        id="update-contact-form"
        :schema="schema"
        :state="form"
        class="space-y-2"
        @submit="handleSubmit"
      >
        <UFormField
          :label="$t('components.contact.updateModal.salutationLabel')"
          name="salutation"
        >
          <USelect
            v-model="form.salutation"
            :items="salutationOptions"
            :placeholder="$t('components.contact.updateModal.salutationPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.updateModal.nameLabel')"
          name="name"
          required
        >
          <UInput
            v-model="form.name"
            :placeholder="$t('components.contact.updateModal.namePlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.updateModal.emailLabel')"
          name="email"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            :placeholder="$t('components.contact.updateModal.emailPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.updateModal.phoneLabel')"
          name="phone"
          required
        >
          <UInput
            v-model="form.phone"
            :placeholder="$t('components.contact.updateModal.phonePlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.updateModal.typeLabel')"
          name="type"
          required
        >
          <USelect
            v-model="form.type"
            :items="typeOptions"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.updateModal.statusLabel')"
          name="isActive"
        >
          <div class="flex items-center gap-2">
            <USwitch v-model="form.isActive" />
            <span class="text-sm text-toned">{{ form.isActive ? $t('components.contact.updateModal.active') : $t('components.contact.updateModal.inactive') }}</span>
          </div>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton
          :label="$t('components.contact.updateModal.cancel')"
          color="neutral"
          variant="soft"
          @click="() => { open = false }"
        />
        <UButton

          type="submit"
          form="update-contact-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('components.contact.updateModal.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { contactService } from '~/services/contact-service'
import type { Contact, ContactPayload } from '~/types/contact'

const open = defineModel<boolean>({ default: false })

const props = defineProps<{
  contact: Contact | null
}>()

const emit = defineEmits<{ updated: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const { t } = useI18n()

const salutationOptions = computed(() => [
  { label: t('components.contact.updateModal.salutationMr'), value: 'mr' },
  { label: t('components.contact.updateModal.salutationMrs'), value: 'mrs' }
])

const typeOptions = computed(() => [
  { label: t('components.contact.updateModal.typeCustomer'), value: 'customer' },
  { label: t('components.contact.updateModal.typeVendor'), value: 'vendor' },
  { label: t('components.contact.updateModal.typeSupplier'), value: 'supplier' },
  { label: t('components.contact.updateModal.typeOther'), value: 'other' }
])

const schema = z.object({
  salutation: z.enum(['mr', 'mrs']).nullable().optional(),
  name: z.string().min(1, t('components.contact.updateModal.nameRequired')),
  email: z.string().min(1, t('components.contact.updateModal.emailRequired')).email(t('components.contact.updateModal.emailInvalid')),
  phone: z.string().min(1, t('components.contact.updateModal.phoneRequired')),
  type: z.enum(['customer', 'vendor', 'supplier', 'other']),
  isActive: z.boolean()
})

const form = reactive<ContactPayload>({
  salutation: undefined,
  name: '',
  email: '',
  phone: '',
  type: 'customer',
  isActive: true
})

const populateForm = () => {
  if (props.contact) {
    form.salutation = props.contact.salutation ?? undefined
    form.name = props.contact.name
    form.email = props.contact.email
    form.phone = props.contact.phone
    form.type = props.contact.type
    form.isActive = props.contact.isActive
  }
}

const handleSubmit = async () => {
  if (!props.contact) return
  isSubmitting.value = true
  try {
    const response = await contactService.update(props.contact.id, form)
    if (response.success) {
      toast.add({
        title: t('components.contact.updateModal.updatedSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('updated')
      open.value = false
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (val) populateForm()
})
</script>
