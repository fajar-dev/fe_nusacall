<template>
  <UModal
    v-model:open="open"
    :title="$t('components.contact.addModal.title')"
    :description="$t('components.contact.addModal.description')"
  >
    <template #body>
      <UForm
        id="add-contact-form"
        :schema="schema"
        :state="form"
        class="space-y-2"
        @submit="handleSubmit"
      >
        <UFormField
          :label="$t('components.contact.addModal.salutationLabel')"
          name="salutation"
        >
          <USelect
            v-model="form.salutation"
            :items="salutationOptions"
            :placeholder="$t('components.contact.addModal.salutationPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.addModal.nameLabel')"
          name="name"
          required
        >
          <UInput
            v-model="form.name"
            :placeholder="$t('components.contact.addModal.namePlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.addModal.emailLabel')"
          name="email"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            :placeholder="$t('components.contact.addModal.emailPlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.addModal.phoneLabel')"
          name="phone"
          required
        >
          <UInput
            v-model="form.phone"
            :placeholder="$t('components.contact.addModal.phonePlaceholder')"
            class="w-full"
          />
        </UFormField>
        <UFormField
          :label="$t('components.contact.addModal.typeLabel')"
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
          :label="$t('components.contact.addModal.statusLabel')"
          name="isActive"
        >
          <div class="flex items-center gap-2">
            <USwitch v-model="form.isActive" />
            <span class="text-sm text-toned">{{ form.isActive ? $t('components.contact.addModal.active') : $t('components.contact.addModal.inactive') }}</span>
          </div>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end items-center gap-2 w-full">
        <UButton
          :label="$t('components.contact.addModal.cancel')"
          color="neutral"
          variant="soft"
          @click="() => { open = false }"
        />
        <UButton

          type="submit"
          form="add-contact-form"
          color="primary"
          :loading="isSubmitting"
        >
          {{ $t('components.contact.addModal.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { contactService } from '~/services/contact-service'
import type { ContactPayload } from '~/types/contact'

const open = defineModel<boolean>({ default: false })
const emit = defineEmits<{ created: [] }>()
const toast = useToast()
const isSubmitting = ref(false)

const { t } = useI18n()

const salutationOptions = computed(() => [
  { label: t('components.contact.addModal.salutationMr'), value: 'mr' },
  { label: t('components.contact.addModal.salutationMrs'), value: 'mrs' }
])

const typeOptions = computed(() => [
  { label: t('components.contact.addModal.typeCustomer'), value: 'customer' },
  { label: t('components.contact.addModal.typeVendor'), value: 'vendor' },
  { label: t('components.contact.addModal.typeSupplier'), value: 'supplier' },
  { label: t('components.contact.addModal.typeOther'), value: 'other' }
])

const schema = z.object({
  salutation: z.enum(['mr', 'mrs']).nullable().optional(),
  name: z.string().min(1, t('components.contact.addModal.nameRequired')),
  email: z.string().min(1, t('components.contact.addModal.emailRequired')).email(t('components.contact.addModal.emailInvalid')),
  phone: z.string().min(1, t('components.contact.addModal.phoneRequired')),
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

const resetForm = () => {
  form.salutation = undefined
  form.name = ''
  form.email = ''
  form.phone = ''
  form.type = 'customer'
  form.isActive = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const response = await contactService.create(form)
    if (response.success) {
      toast.add({
        title: t('components.contact.addModal.createdSuccess'),
        color: 'success',
        icon: 'i-lucide-circle-check'
      })
      emit('created')
      open.value = false
      resetForm()
    }
  } finally {
    isSubmitting.value = false
  }
}

watch(open, (val) => {
  if (!val) resetForm()
})
</script>
